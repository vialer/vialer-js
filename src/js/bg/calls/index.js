const callFactory = require('./call/factory')
const transform = require('sdp-transform')
const Module = require('../lib/module')


/**
* The call module takes care of the plumbing involved with setting up
* and breaking down calls. The user interface mostly emits events,
* because the state logic involved depends on the calls and their
* state.
*/
class CallsModule extends Module {
    /**
    * @param {App} app - The application object.
    */
    constructor(...args) {
        super(...args)

        this.lib = require('sip.js')
        // Keeps track of calls. Keys match Sip.js session keys.
        this.calls = {}
        // This flag indicates whether a reconnection attempt will be
        // made when the websocket connection is gone.
        this.reconnect = true
        // The default connection timeout to start with.
        this.retryDefault = {interval: 2500, limit: 9000000}
        // Used to store retry state.
        this.retry = Object.assign({}, this.retryDefault)
        // // Start with a clean state.
        this.app.setState({calls: this._defaultState()})

        this.app.on('bg:calls:call_accept', ({callId}) => this.calls[callId].accept())
        this.app.on('bg:calls:call_activate', ({callId, holdInactive, unholdActive}) => {
            this.activateCall(this.calls[callId], holdInactive, unholdActive)
        })

        /**
        * The main event to create a new call with from the foreground.
        * @param {Object} callInfo - The Call data to start the call with.
        * @param {String} callInfo.number - The number to call.
        * @param {String} callInfo.start - Whether to start calling right away or just create a Call instance.
        * @param {String} callInfo.type - Defines the Call implementation. Leave empty to use the one supported
        *                                 by the application settings.
        */
        this.app.on('bg:calls:call_create', ({number, start, type}) => {
            // Always sanitize the number.
            number = this.app.utils.sanitizeNumber(number)
            // Blind transfer when the current active call is in blind
            // transfer mode.

            let activeCall = this.activeCall(true)
            if (activeCall && activeCall.state.transfer.active && activeCall.state.transfer.type === 'blind') {
                // Directly transfer the number to the currently activated
                // call when the active call has blind transfer mode set.
                this.app.telemetry.event('call[sip]', 'transfer', 'blind')
                activeCall.transfer(number)
            } else {
                // Both a 'regular' new call and an attended transfer call will
                // create or get a new call and active it.
                let call = this._emptyCall(type, number)

                // Sync the state back to the foreground.
                if (start) call.start()
                this.__setTransferState()
                // // A newly created call is always activated.
                this.activateCall(call, true, true)
            }
        })

        this.app.on('bg:calls:call_delete', ({callId}) => this.deleteCall(this.calls[callId]))
        this.app.on('bg:calls:call_start', (callState) => {
            this.calls[callState.id].setState(callState)
            this.calls[callState.id].start()
            this.app.setState({ui: {layer: 'calls'}})
        })

        this.app.on('bg:calls:call_terminate', ({callId}) => this.calls[callId].terminate())
        this.app.on('bg:calls:connect', () => this.connect())
        this.app.on('bg:calls:disconnect', ({reconnect}) => this.disconnect(reconnect))

        this.app.on('bg:calls:dtmf', ({callId, key}) => this.calls[callId].session.dtmf(key))
        this.app.on('bg:calls:hold_toggle', ({callId}) => {
            const call = this.calls[callId]
            if (!call.state.hold.active) {
                call.hold()
            } else {
                // Unhold while the call's transfer is active must also
                // undo the previously set transfer state on this call and
                // on others.
                if (call.state.transfer.active) {
                    // Unset the transfer state when it was active during an unhold.
                    this.__setTransferState(call, !call.state.transfer.active)
                }
                this.activateCall(call, true, true)
            }
        })


        /**
        *
        * @param {String} callId - The call id of the call to transfer to.
        */
        this.app.on('bg:calls:transfer_finalize', ({callId}) => {
            // Find origin.
            let sourceCall
            for (const _callId of Object.keys(this.calls)) {
                if (this.calls[_callId].state.transfer.active) {
                    sourceCall = this.calls[_callId]
                }
            }
            this.app.telemetry.event('call[sip]', 'transfer', 'attended')
            sourceCall.transfer(this.calls[callId])
        })


        /**
         * Toggle hold for the call that needs to be transferred. Set
         * transfer mode to active for this call.
         */
        this.app.on('bg:calls:transfer_toggle', ({callId}) => {
            const sourceCall = this.calls[callId]
            this.__setTransferState(sourceCall, !sourceCall.state.transfer.active)
        })
    }

    /**
    * Set the transfer state of a source call and update the transfer state of
    * other calls. This method doesn't change the intended transfer status
    * when no source Call is passed along. It just update outdated call state
    * in that case.
    * @param {Call} [sourceCall] - The call to update the calls status for.
    * @param {Boolean} active - The transfer status to switch or update to.
    */
    __setTransferState(sourceCall = {id: null}, active) {
        const callIds = Object.keys(this.calls)
        // Look for an active transfer call when the source call isn't
        // passed as a parameter.
        if (!sourceCall.id) {
            for (let _callId of callIds) {
                if (this.calls[_callId].state.transfer.active) {
                    sourceCall = this.calls[_callId]
                    // In this case we are not toggling the active status;
                    // just updating the status of other calls.
                    active = true
                    break
                }
            }
        }

        // Still no sourceCall. There is no transfer active at the moment.
        // Force all calls to deactivate their transfer.
        if (!sourceCall.id) active = false

        if (active) {
            // Enable transfer mode.
            if (sourceCall.id) {
                // Always disable the keypad, set the sourceCall on-hold and
                // switch to the default `attended` mode when activating
                // transfer mode on a call.
                sourceCall.setState({keypad: {active: false}, transfer: {active: true, type: 'attended'}})
                sourceCall.hold()
            }
            // Set attended status on other calls.
            for (let _callId of callIds) {
                const _call = this.calls[_callId]
                if (_callId !== sourceCall.id) {
                    _call.setState({transfer: {active: false, type: 'accept'}})
                    // Hold all other ongoing calls.
                    if (!['new', 'create', 'invite'].includes(_call.state.status) && !_call.state.hold) {
                        _call.hold()
                    }
                }
            }
        } else {
            // Disable transfer mode.
            if (sourceCall.id) {
                sourceCall.setState({transfer: {active: false, type: 'attended'}})
                sourceCall.unhold()
            }
            // Set the correct state of all other calls; se the transfer
            // type to accept and disable transfer modus..
            for (let _callId of callIds) {
                const _call = this.calls[_callId]
                if (_callId !== sourceCall.id) {
                    this.calls[_callId].setState({transfer: {active: false, type: null}})
                    // Make sure all other ongoing calls stay on hold.
                    if (!['new', 'create', 'invite'].includes(_call.state.status) && !_call.state.hold) {
                        _call.hold()
                    }
                }
            }
        }
    }


    __uaOptions() {
        const settings = this.app.state.settings
        // For webrtc this is a voipaccount, otherwise an email address.
        let options = {
            log: {
                builtinEnabled: true,
                level: 'error',
            },
            sessionDescriptionHandlerFactoryOptions: {
                constraints: {
                    audio: true,
                    video: false,
                },
                modifiers: [this._formatSdp],
            },
            stunServers: [
                'stun.voipgrid.nl',
            ],
            traceSip: false,
            userAgentString: this._userAgent(),
            wsServers: [`wss://${settings.sipEndpoint}`],
        }

        // Log in with the WebRTC voipaccount when it is enabled.
        // The voipaccount should be from the same client as the logged-in
        // user, or subscribe information won't work.
        if (settings.webrtc.enabled) {
            options.authorizationUser = settings.webrtc.account.username
            options.password = settings.webrtc.account.password
            options.register = true
            options.uri = `sip:${settings.webrtc.account.username}@voipgrid.nl`
        } else {
            // Login with platform email without SIP register.
            options.authorizationUser = this.app.state.user.username
            // Use the platform user token when logging in; not the password.
            options.password = this.app.state.user.platform.tokens.sip
            options.register = false
            options.uri = `sip:${this.app.state.user.username}`
        }

        return options
    }


    /**
    * Check if there is a `new` call ready to be used. Requires some
    * bookkeeping because of the settings that can change in the
    * meanwhile.
    * @param {String} type - The type of call to produce.
    * @param {String} [number] - The number to call to.
    * @returns {Call} - A new Call object or an existing Call object with status `new`.
    */
    _emptyCall(type, number = null) {
        let call
        for (const callId of Object.keys(this.calls)) {
            if (this.calls[callId].state.status !== 'new') continue

            if (type) {
                // Otherwise we just check if the call matches the
                // expected type.
                if (this.calls[callId].constructor.name !== type) this.deleteCall(this.calls[callId])
                else call = this.calls[callId]
            } else {
                // When an empty call already exists, it must
                // adhere to the current WebRTC-SIP/ConnectAB settings
                // if the Call type is not explicitly passed.
                if (this.app.state.settings.webrtc.enabled) {
                    if (this.calls[callId].constructor.name === 'CallConnectAB') {
                        this.app.logger.debug(`${this}recreate a new call`)
                        this.deleteCall(this.calls[callId])
                    } else {
                        call = this.calls[callId]
                    }
                } else {
                    if (this.calls[callId].constructor.name === 'CallSIP') {
                        this.app.logger.debug(`${this}recreate a new call`)
                        this.deleteCall(this.calls[callId])
                    } else call = this.calls[callId]
                }
            }

            if (this.calls[callId]) call = this.calls[callId]
            break
        }
        if (!call) {
            call = callFactory(this, number, {}, type)
        }
        this.calls[call.id] = call
        // Set the number and propagate the call state to the foreground.
        call.state.number = number
        call.setState(call.state)
        // Always set the number in the local state.
        this.app.logger.debug(`${this}returning a ${call.constructor.name} instance with 'new' state`)
        return call
    }


    _formatSdp(sessionDescription) {
        let allowedCodecs = ['G722', 'telephone-event', 'opus']
        let sdpObj = transform.parse(sessionDescription.sdp);
        let rtp = {media: []}
        let payloads = []
        let fmtps = []
        for (let codec of sdpObj.media[0].rtp) {
            if (allowedCodecs.includes(codec.codec)) {
                rtp.media.push(codec)
                payloads.push(codec.payload)
            }
        }

        for (let fmtp of sdpObj.media[0].fmtp) {
            if (payloads.includes(fmtp.payload)) {
                fmtps.push(fmtp)
            }
        }
        sdpObj.media[0].rtp = rtp.media
        sdpObj.media[0].payloads = payloads.join(' ')
        sdpObj.media[0].fmtp = fmtps
        sessionDescription.sdp = transform.write(sdpObj)
        return Promise.resolve(sessionDescription)
    }


    _initialState() {
        return {
            calls: {},
            ua: {
                state: null,
            },
        }
    }


    _hydrateState(moduleStore) {
        moduleStore.calls = {}
    }


    /**
    * Build the useragent string to identify Vialer-js with.
    * The format is `Vialer-js/<VERSION> (<OS/<ENV>) <Vendor>`
    * @returns {String} - Useragent string.
    */
    _userAgent() {
        const env = this.app.env
        // Don't use dynamic extension state here as version.
        // Vialer-js may run outside of an extension context.
        let userAgent = 'Vialer-js/' + process.env.VERSION
        if (env.isLinux) userAgent += '(Linux/'
        else if (env.isMacOS) userAgent += '(MacOS/'
        else if (env.isWindows) userAgent += '(Windows/'

        if (env.isChrome) userAgent += 'Chrome'
        if (env.isElectron) userAgent += 'Electron'
        else if (env.isFirefox) userAgent += 'Firefox'
        else if (env.isEdge) userAgent += 'Edge'
        userAgent += `) ${this.app.state.vendor}`
        return userAgent
    }

    /**
    * A loosely coupled Call action handler. Operates on all Calls.
    * Supported actions are:
    *   `accept-new`: Accepts an incoming call or switch to the new call dialog.
    *   `deline-hangup`: Declines an incoming call or an active call.
    * @param {String} action - The action; `accept-new` or `decline`.
    */
    callAction(action) {
        let inviteCall = null

        for (const callId of Object.keys(this.calls)) {
            // Don't select a call that is already closing
            if (this.calls[callId].state.status === 'invite') inviteCall = this.calls[callId]
        }

        if (action === 'accept-new') {
            if (inviteCall) inviteCall.accept()
            else {
                const call = this._emptyCall()
                this.activateCall(call, true)
                this.app.setState({ui: {layer: 'calls'}})
            }
        } else if (action === 'decline-hangup') {
            // Ongoing Calls can also be terminated.
            let activeCall = this.activeCall()
            if (inviteCall) inviteCall.terminate()
            else if (activeCall) activeCall.terminate()
        }
    }


    /**
    * @param {Boolean} ongoing - Whether to check if the call is ongoing or not.
    * @returns {Call|null} - the current active ongoing call or null.
    */
    activeCall(ongoing = false) {
        let activeCall = null
        for (const callId of Object.keys(this.calls)) {
            // Don't select a call that is already closing
            if (this.calls[callId].state.active) {
                if (!ongoing) activeCall = this.calls[callId]
                else if (!['bye', 'rejected_a', 'rejected_b'].includes(this.calls[callId].state.status)) activeCall = this.calls[callId]
            }
        }
        return activeCall
    }


    /**
    * Set the active state on the target call, un-hold the call and
    * put all other calls on-hold.
    * @param {Call} [call] - A Call to activate.
    * @param {Boolean} [holdOthers] - Unhold the call on activation.
    * @param {Boolean} [unholdOwn] - Unhold the call on activation.
    * @returns {Call|Boolean} - The Call or false.
    */
    activateCall(call, holdOthers = true, unholdOwn = false) {
        let activeCall = false
        const callIds = Object.keys(this.calls)

        if (!call) {
            // Activate the first found ongoing call when no call is given.
            for (const callId of callIds) {
                // Don't select a call that is already closing.
                if (!['bye', 'rejected_a', 'rejected_b'].includes(this.calls[callId].state.status)) {
                    call = this.calls[callId]
                }
            }
            if (!call) return false
        }
        for (const callId of Object.keys(this.calls)) {
            let _call = this.calls[callId]
            // A call that is closing. Don't bother changing hold
            // and active state properties.
            if (!['bye', 'rejected_a', 'rejected_b'].includes(call.state.status)) {
                if (call.id === callId) {
                    activeCall = this.calls[callId]
                    _call.setState({active: true})
                    // New calls don't have a session yet. Nothing to unhold.
                    if (unholdOwn && !['new', 'create', 'invite'].includes(_call.state.status)) {
                        _call.unhold()
                    }
                } else {
                    _call.setState({active: false})
                    // New calls don't have a session yet. Nothing to hold.
                    if (holdOthers && !['new', 'create', 'invite'].includes(_call.state.status)) {
                        _call.hold()
                    }
                }
            }
        }

        return activeCall
    }


    /**
    * Init and start a new stack, connecting
    * SipML5 to the websocket SIP backend.
    */
    connect() {
        // Reconnect when already connected.
        if (this.ua && this.ua.isConnected()) {
            this.disconnect(true)
            return
        }

        // Login with the WebRTC account or platform account.
        let uaOptions = this.__uaOptions()
        if (!uaOptions.authorizationUser || !uaOptions.password) {
            this.app.logger.warn(`${this}cannot connect without username and password`)
        }

        this.app.setState({calls: {ua: {state: 'disconnected'}}})
        this.ua = new this.lib.UA(uaOptions)

        // An incoming call. Set the session object and set state to call.
        this.ua.on('invite', (session) => {
            // Call-waiting is not supported(for now). A new incoming call
            // on top of a call that is already active will be silently
            // dropped.
            const callIds = Object.keys(this.calls)

            if (
                // No microphone access; don't accept any Call.
                this.app.state.settings.webrtc.permission &&
                // Do not disturb; skip any incoming Call.
                !this.app.state.availability.dnd &&
                // No ongoing Calls yet.
                (callIds.length === 0 || (callIds.length === 1 && this.calls[callIds[0]].state.status === 'new'))
            ) {
                // No reason to pretend that we can switch to a different type
                // of call(yet), because Connectab can't handle incoming calls.
                const call = callFactory(this, session, {}, 'CallSIP')
                this.calls[call.id] = call
                call.start()
            } else {
                // Treat the call as a silenced call and terminate it directly.
                const call = callFactory(this, session, {silent: true}, 'CallSIP')
                call.start()
                call.terminate()
            }
        })


        this.ua.on('registered', () => {
            this.app.setState({calls: {ua: {state: 'registered'}}})
            this.app.logger.info(`${this}ua registered`)
        })


        this.ua.on('unregistered', () => {
            this.app.setState({calls: {ua: {state: 'unregistered'}}})
            this.app.logger.info(`${this}ua unregistered`)
        })


        this.ua.on('connected', () => {
            this.app.setState({calls: {ua: {state: 'connected'}}})
            this.app.logger.info(`${this}ua connected`)
        })


        this.ua.on('disconnected', () => {
            this.app.setState({calls: {ua: {state: 'disconnected'}}})
            this.app.logger.info(`${this}ua disconnected`)

            if (this.reconnect) {
                this.app.logger.debug(`${this}reconnecting ua`)
                this.connect()
            }
        })


        this.ua.on('registrationFailed', (reason) => {
            this.app.setState({calls: {ua: {state: 'registration_failed'}}})
        })
    }


    /**
    * Take care of cleaning up an ending call.
    * @param {Call} call - The call object to remove.
    */
    deleteCall(call) {
        delete this.app.state.calls.calls[call.id]
        delete this.calls[call.id]
        // This call is being cleaned up; move to a different call
        // when this call was the active call.
        if (call.state.active) {
            let activeCall
            for (const callId of Object.keys(this.calls)) {
                // Don't select a call that is already closing.
                if (!['bye', 'rejected_a', 'rejected_b'].includes(this.calls[callId].state.status)) {
                    activeCall = this.calls[callId]
                    break
                }
            }

            if (activeCall) {
                this.activateCall(null, true, false)
            }
        }

        this.app.emit('fg:set_state', {action: 'delete', path: `calls/calls/${call.id}`})
    }


    /**
    * Graceful stop, do not reconnect automatically.
    * @param {Boolean} reconnect - Whether try to reconnect.
    */
    disconnect(reconnect = true) {
        this.reconnect = reconnect
        if (this.ua && this.ua.isConnected()) {
            this.ua.stop()
            this.app.logger.debug(`${this}disconnected ua`)
        }
    }


    toString() {
        return `${this.app}[calls] `
    }

}

module.exports = CallsModule
