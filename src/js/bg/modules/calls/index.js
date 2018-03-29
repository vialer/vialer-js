/**
* The Call module takes care of the plumbing involved with setting up
* and breaking down Calls. `AppForeground` interacts with this module
* by emitting events. The Calls module maintains the state bookkeeping
* of all the tracked Calls.
* @module ModuleCalls
*/
const transform = require('sdp-transform')
const Module = require('../../lib/module')


/**
* Main entrypoint for Calls.
* @memberof AppBackground.modules
*/
class ModuleCalls extends Module {
    /**
    * @param {AppBackground} app - The background application.
    */
    constructor(app) {
        super(app)

        this.callFactory = require('./call/factory')(this.app)
        this.lib = require('sip.js')
        // Keeps track of calls. Keys match Sip.js session keys.
        this.calls = {}
        // This flag indicates whether a reconnection attempt will be
        // made when the websocket connection is gone.
        this.reconnect = true
        // The default connection timeout to start with.
        this.retryDefault = {interval: 1250, limit: 60000, timeout: 1250}
        // Used to store retry state.
        this.retry = Object.assign({}, this.retryDefault)

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
        this.app.on('bg:calls:call_create', ({callback, number, start, type}) => {
            // Always sanitize the number.
            number = this.app.utils.sanitizeNumber(number)

            let activeCall = this.activeCall(true)
            if (activeCall && activeCall.state.transfer.active && activeCall.state.transfer.type === 'blind') {
                // Directly transfer the number to the currently activated
                // call when the active call has blind transfer mode set.
                this.app.telemetry.event('call[sip]', 'transfer', 'blind')
                activeCall.transfer(number)
            } else {
                // Both a 'regular' new call and an attended transfer call will
                // create or get a new Call and activate it.
                let call = this._emptyCall({number, type})

                // Sync the state back to the foreground.
                if (start) call.start()
                this.__setTransferState()
                // A newly created call is always activated unless
                // there is another call already ringing.
                if (!Object.keys(this.calls).find((i) => ['create', 'invite'].includes(this.calls[i].state.status))) {
                    this.activateCall(call, true, true)
                }

                if (callback) callback({call: call.state})
            }
        })

        this.app.on('bg:calls:call_delete', ({callId}) => {
            if (this.calls[callId]) this.deleteCall(this.calls[callId])
            else this.app.logger.debug(`${this}trying to delete non-existent Call with id ${callId}`)
        })
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


    /**
    * Setup the initial UA options. This depends for instance
    * on whether the application will be using the softphone
    * to connect to the backend with or the vendor portal user.
    * @returns {Object} UA options that are passed to Sip.js
    */
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
                modifiers: [this._formatSdp.bind(this)],
            },
            traceSip: false,
            userAgentString: this._userAgent(),
            wsServers: [`wss://${settings.sipEndpoint}`],
        }

        // Log in with the WebRTC voipaccount when it is enabled.
        // The voipaccount should be from the same client as the logged-in
        // user, or subscribe information won't work.
        if (settings.webrtc.enabled && (settings.webrtc.account.selected.username && settings.webrtc.account.selected.password)) {
            options.authorizationUser = settings.webrtc.account.selected.username
            options.password = settings.webrtc.account.selected.password
            options.register = true
            options.uri = `sip:${settings.webrtc.account.selected.username}@voipgrid.nl`
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
    * @param {Object} opts - Options to pass.
    * @param {String} [opts.type] - The type of call to find.
    * @param {String} [opts.number] - The number to call to.
    * @returns {Call} - A new or existing Call with status `new`.
    */
    _emptyCall({number = null, type}) {
        let call

        // See if we can reuse an existing `new` Call object.
        for (const callId of Object.keys(this.calls)) {
            if (this.calls[callId].state.status !== 'new') continue

            if (type) {
                // Otherwise we just check if the call matches the
                // expected type.
                if (this.calls[callId].constructor.name !== type) {
                    this.deleteCall(this.calls[callId])
                } else {
                    call = this.calls[callId]
                }
            } else {
                // When an empty call already exists, it must
                // adhere to the current WebRTC-SIP/ConnectAB settings
                // if the Call type is not explicitly passed.
                if (this.app.state.settings.webrtc.enabled) {
                    if (this.calls[callId].constructor.name === 'CallConnectAB') {
                        this.deleteCall(this.calls[callId])
                    } else {
                        call = this.calls[callId]
                    }
                } else {
                    if (this.calls[callId].constructor.name === 'CallSIP') {
                        this.deleteCall(this.calls[callId])
                    } else call = this.calls[callId]
                }
            }

            if (this.calls[callId]) call = this.calls[callId]
            break
        }

        if (!call) {
            call = this.callFactory(number, {}, type)
        }
        this.calls[call.id] = call
        // Set the number and propagate the call state to the foreground.
        call.state.number = number
        call.setState(call.state)

        // Sync the store's reactive properties to the foreground.
        if (!this.app.state.calls.calls[call.id]) {
            Vue.set(this.app.state.calls.calls, call.id, call.state)
            this.app.emit('fg:set_state', {action: 'insert', path: `calls/calls/${call.id}`, state: call.state})
        }

        // Always set the number in the local state.
        this.app.logger.debug(`${this}_emptyCall ${call.constructor.name} instance`)
        return call
    }


    /**
    * Reformat the SDP of the {@link https://sipjs.com/api/0.9.0/sessionDescriptionHandler/|SessionDescription}
    * when setting up a connection, so we can force opus or G722 codec to be
    * the preference of the backend.
    * @param {SessionDescription} sessionDescription - A Sip.js SessionDescription handler.
    * @returns {SessionDescription} A SessionDescription with a modfied sdp object.
    */
    _formatSdp(sessionDescription) {
        const selectedCodec = this.app.state.settings.webrtc.codecs.selected.name

        // (!) The `opus` codec must always be in the sdp.
        let allowedCodecs = ['telephone-event', 'opus']
        if (selectedCodec !== 'opus') allowedCodecs.push(selectedCodec)

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


    /**
    * Initializes the module's store.
    * @returns {Object} The module's store properties.
    */
    _initialState() {
        return {
            calls: {},
            ua: {
                status: 'inactive',
            },
        }
    }


    /**
    * Restore stored dumped state from localStorage.
    * @param {Object} moduleStore - Root property for this module.
    */
    _restoreState(moduleStore) {
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
        // Vialer-js may run outside of an extension's (manifest)
        // context. Also don't use template literals, because envify
        // can't deal with string replacement otherwise.
        let userAgent = 'Vialer-js/' + process.env.VERSION + ' '
        if (env.isLinux) userAgent += '(Linux/'
        else if (env.isMacOS) userAgent += '(MacOS/'
        else if (env.isWindows) userAgent += '(Windows/'

        if (env.isChrome) userAgent += 'Chrome'
        if (env.isElectron) userAgent += 'Electron'
        else if (env.isFirefox) userAgent += 'Firefox'
        else if (env.isEdge) userAgent += 'Edge'
        userAgent += `) ${this.app.state.app.vendor.name}`
        return userAgent
    }


    /**
    * Delegate call-related actions.
    * @returns {Object} - Properties that need to be watched.
    */
    _watchers() {
        return {
            /**
            * Respond to network changes.
            * @param {Boolean} isOnline - Whether we are online now.
            * @param {Boolean} wasOnline - Whether we were online.
            */
            'store.app.online': (isOnline, wasOnline) => {
                if (!isOnline) {
                    this.app.setState({calls: {ua: {status: 'disconnected'}}})
                } else {
                    // We are online again.
                    this.retry = Object.assign({}, this.retryDefault)
                    this.app.setState({calls: {ua: {status: 'reconnect'}}})
                }
            },
            /**
            * Watch for changes in UA status. The following statuses
            * (in logical order) are used: `inactive`, `disconnected`, `connected`,
            * `registered`, `registration_failed`.
            * @param {String} newUAStatus - What the UA status has become.
            * @param {String} oldUAStatus - What the UA status was.
            */
            'store.calls.ua.status': (newUAStatus, oldUAStatus) => {
                let platformStatusbar
                if (this.app.env.isExtension) platformStatusbar = browser.browserAction.setIcon
                else {
                    // This is just an empty placeholder for other platforms
                    // like Electron for now.
                    platformStatusbar = function() {}
                }

                if (['inactive', 'reconnect'].includes(newUAStatus)) {
                    platformStatusbar({path: 'img/menubar-inactive.png'})
                    // A reconnect request can be made by setting the ua status
                    // to reconnect.
                    if (newUAStatus === 'reconnect') {
                        // Reconnection logic is performed only here; other parts
                        // of the app just assume that a reconnect is needed,
                        // no matter what state the user is in.
                        if (this.app.state.user.authenticated) {
                            this.app.logger.debug(`${this}ua reconnecting in ${this.retry.timeout} ms`)
                            setTimeout(() => this.connect(), this.retry.timeout)
                            this.retry = this.app.timer.increaseTimeout(this.retry)
                        } else {
                            this.app.logger.debug(`${this}not reconnecting, because user is not authenticated`)
                        }
                    }
                } else {
                    if (this.app.state.settings.webrtc.enabled) {
                        if (newUAStatus === 'registered') platformStatusbar({path: 'img/menubar-active.png'})
                        else platformStatusbar({path: 'img/menubar-unavailable.png'})
                    } else {
                        // ConnectAB only connects to a SIP backend.
                        if (newUAStatus === 'connected') platformStatusbar({path: 'img/menubar-active.png'})
                        else {
                            // The `registered` status is also considered to be incorrect
                            // with ConnectAB.
                            browser.browserAction.setIcon({path: 'img/menubar-unavailable.png'})
                        }
                    }
                }
            },
        }
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
        const callIds = Object.keys(this.calls)

        if (!call) {
            // Activate the first found ongoing call when no call is given.
            for (const callId of callIds) {
                // Don't select a call that is already closing.
                if (!['bye', 'rejected_a', 'rejected_b'].includes(this.calls[callId].state.status)) {
                    call = this.calls[callId]
                }
            }

            if (!call) {
                this.app.logger.debug(`${this}no call to activate!`)
                return false
            }
        }
        for (const callId of Object.keys(this.calls)) {
            let _call = this.calls[callId]
            // A call that is closing. Don't bother changing hold
            // and active state properties.
            if (call.id === callId) {
                call.setState({active: true})
                // Only unhold calls that are in the right state.
                if (unholdOwn && _call.state.status === 'accepted') {
                    _call.unhold()
                }
            } else {
                _call.setState({active: false})
                // Only hold calls that are in the right state.
                if (holdOthers && _call.state.status === 'accepted') {
                    _call.hold()
                }
            }
        }

        return call
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
                else if (this.calls[callId].state.status === 'accepted') activeCall = this.calls[callId]
            }
        }
        return activeCall
    }


    /**
    * A loosely coupled Call action handler. Operates on all current Calls.
    * Supported actions are:
    *   `accept-new`: Accepts an incoming call or switch to the new call dialog.
    *   `deline-hangup`: Declines an incoming call or an active call.
    *   `hold-active`: Toggle hold on the active call.
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
        } else if (action === 'hold-active') {
            let activeCall = this.activeCall()
            // Make sure the action isn't provoked on a closing call.
            if (activeCall && activeCall.state.status === 'accepted') {
                if (activeCall.state.hold.active) activeCall.unhold()
                else activeCall.hold()
            }
        }
    }


    /**
    * Initialize the SIPJS UserAgent and register its events.
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

        this.app.setState({calls: {ua: {status: 'disconnected'}}})
        this.ua = new this.lib.UA(uaOptions)


        /**
        * An incoming call. Call-waiting is not implemented.
        * A new incoming call on top of a call that is already
        * ongoing will be silently terminated.
        */
        this.ua.on('invite', (session) => {
            const callIds = Object.keys(this.calls)
            const callOngoing = this.app.helpers.callOngoing()
            const closingCalls = this.app.helpers.callsClosing()
            const dnd = this.app.state.availability.dnd
            const microphoneAccess = this.app.state.settings.webrtc.permission

            let acceptCall = true
            if (dnd || !microphoneAccess) acceptCall = false

            if (callOngoing) {
                // All ongoing calls are closing. It is save to accept the call.
                if (callIds.length === closingCalls.length) {
                    acceptCall = true
                } else {
                    const notClosingCalls = callIds.filter((i) => !closingCalls.includes(i))
                    const notClosingNotNewCalls = notClosingCalls.filter((i) => this.calls[i].state.status !== 'new')

                    if (notClosingNotNewCalls.length) acceptCall = false
                    else acceptCall = true
                }
            }

            if (acceptCall) {
                this.app.logger.info(`${this}accept incoming call.`)
                // An ongoing call may be a closing call. In that case we first
                // remove all the closing calls before starting the new one.
                for (const callId of closingCalls) {
                    this.app.logger.info(`${this}deleting closing call ${callId}.`)
                    this.deleteCall(this.calls[callId])
                }
            }
            // A declined Call will still be initialized, but as a silent
            // Call, meaning it won't notify the user about it.
            const call = this.callFactory(session, {silent: !acceptCall}, 'CallSIP')
            this.calls[call.id] = call
            call.start()

            if (!acceptCall) {
                this.app.logger.info(`${this}decline incoming call`)
                call.terminate()
            } else {
                Vue.set(this.app.state.calls.calls, call.id, call.state)
                this.app.emit('fg:set_state', {action: 'insert', path: `calls/calls/${call.id}`, state: call.state})
            }
        })


        this.ua.on('registered', () => {
            this.app.setState({calls: {ua: {status: 'registered'}}})
            this.app.logger.info(`${this}ua registered`)
        })


        this.ua.on('unregistered', () => {
            this.app.setState({calls: {ua: {status: 'connected'}}})
            this.app.logger.info(`${this}ua unregistered, switch back to connected status`)
        })


        this.ua.on('connected', () => {
            this.app.setState({calls: {ua: {status: 'connected'}}})
            this.app.logger.info(`${this}ua connected`)
            // Reset the retry interval timer..
            this.retry = Object.assign({}, this.retryDefault)
        })


        this.ua.on('disconnected', () => {
            // Don't use SIPJS simpler reconnect logic, which doesn't have
            // jitter and an increasing timeout.
            this.ua.stop()
            if (this.reconnect) {
                this.app.setState({calls: {ua: {status: 'reconnect'}}})
                this.app.logger.debug(`${this}ua disconnected (reconnection attempt)`)
            } else {
                // Reset the retry interval timeout.
                this.retry = Object.assign({}, this.retryDefault)
                this.app.setState({calls: {ua: {status: 'inactive'}}})
                this.app.logger.debug(`${this}ua disconnected (not reconnecting)`)
            }

        })


        this.ua.on('registrationFailed', (reason) => {
            this.app.setState({calls: {ua: {status: 'registration_failed'}}})
        })
    }


    /**
    * Take care of cleaning up an ending call.
    * @param {Call} call - The call object to remove.
    */
    deleteCall(call) {
        // This call is being cleaned up; move to a different call
        // when this call was the active call.
        if (call.state.active) {
            let activeCall = null
            let fallbackCall = null
            for (const callId of Object.keys(this.calls)) {
                // We are not going to activate the Call we are deleting.
                if (callId === call.id) continue

                // Prefer not to switch to a call that is already closing.
                if (['bye', 'rejected_a', 'rejected_b'].includes(this.calls[callId].state.status)) {
                    // The fallback Call is a non-specific closing call.
                    if (this.calls[callId]) fallbackCall = this.calls[callId]
                } else {
                    activeCall = this.calls[callId]
                    break
                }

            }
            // Just select the first closing Call in case all of them are closing.
            if (!activeCall && fallbackCall) activeCall = fallbackCall
            this.activateCall(activeCall, true, false)
        }

        // Finally delete the call and its references.
        Vue.delete(this.app.state.calls.calls, call.id)
        delete this.calls[call.id]

        this.app.emit('fg:set_state', {action: 'delete', path: `calls/calls/${call.id}`})
    }


    /**
    * Graceful stop, do not reconnect automatically.
    * @param {Boolean} reconnect - Whether try to reconnect.
    */
    disconnect(reconnect = true) {
        this.reconnect = reconnect
        // Directly try to reconnect.
        if (reconnect) this.retry.timeout = 0
        if (this.ua && this.ua.isConnected()) {
            this.ua.stop()
            this.app.logger.debug(`${this}ua disconnected`)
        }
    }


    /**
    * Generate a representational name for this module. Used for logging.
    * @returns {String} - An identifier for this module.
    */
    toString() {
        return `${this.app}[calls] `
    }
}

module.exports = ModuleCalls
