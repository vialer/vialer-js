const Call = require('./call_webrtc')
const Presence = require('./presence')


/**
* The SIP class takes care of all SIP communication in the background.
* Currently this is used to check the presence of contacts.
*/
class Sip {
    /**
    * @param {ClickToDialApp} app - The application object.
    */
    constructor(app) {
        this.app = app
        this.lib = require('sip.js')

        // Keeps track of calls. Keys match Sip.js session keys.
        this.calls = {}
        // This flag indicates whether a reconnection attempt will be
        // made when the websocket connection is gone.
        this.reconnect = true
        this.state = this.app.state.sip
        // TODO: Don't persist this at all.
        this.state.calls = {}

        // The default connection timeout to start with.
        this.retryDefault = {interval: 2500, limit: 9000000}
        // Used to store retry state.
        this.retry = Object.assign({}, this.retryDefault)

        // Start with a clean state.
        this.app.setState({sip: this.app.getDefaultState().sip})

        this.app.on('bg:sip:call', ({number}) => {
            this.createCall(number, {active: true})
        })

        this.app.on('bg:sip:call_answer', ({callId}) => {
            this.calls[callId].answer()
        })

        // Self-initiated request to stop the session during one of
        // the phases of a call.
        this.app.on('bg:sip:call_terminate', ({callId}) => {
            this.calls[callId].terminate()
        })

        this.app.on('bg:sip:call_activate', ({callId, holdInactive, unholdActive}) => {
            this.setActiveCall(this.calls[callId], holdInactive, unholdActive)
        })

        this.app.on('bg:sip:dtmf', ({callId, key}) => {
            this.calls[callId].session.dtmf(key)
        })

        this.app.on('bg:sip:hold_toggle', ({callId}) => {
            if (!this.calls[callId].state.hold) this.calls[callId].hold()
            else {
                this.calls[callId].unhold()
                // Unset transfer mode when switching of hold.
                if (this.calls[callId].state.transfer.active) {
                    this.calls[callId].setState({transfer: {active: false}})
                }

                // If we unhold this call, then all other calls
                // should be put on hold.
                for (let _callId of Object.keys(this.calls)) {
                    if (_callId !== callId) {
                        this.calls[_callId].hold()
                    }
                }
            }
        })

        /**
        * Situation: Caller A and B are connected. B is also connected to
        * caller C. B and C will directly connect to each other in case of
        * a blind transfer. An attended transfer needs to call
        * the `sip:transfer_finalize` listener afterwards.
        * @param {Object} options - Options.
        */
        this.app.on('bg:sip:transfer_activate', ({callId, number}) => {
            if (this.calls[callId].state.transfer.type === 'blind') {
                this.calls[callId].transfer(number, 'blind')
            } else {
                this.calls[callId].transfer(number, 'attended')
            }
        })


        /**
        *
        * @param {String} callId - The call id of the call to transfer to.
        */
        this.app.on('bg:sip:transfer_finalize', ({callId}) => {
            // Find origin.
            let sourceCall
            for (const _callId of Object.keys(this.calls)) {
                if (this.calls[_callId].state.transfer.active) {
                    sourceCall = this.calls[_callId]
                }
            }
            sourceCall.transfer(this.calls[callId], 'attended')
        })

        /**
         * Toggle hold for the call that needs to be transferred. Set
         * transfer mode to active for this call. Set transfer_
         */
        this.app.on('bg:sip:transfer_toggle', ({callId}) => {
            // Hold the current call.
            if (!this.calls[callId].state.transfer.active) {
                if (!this.calls[callId].state.hold) this.calls[callId].hold()
                this.calls[callId].setState({transfer: {active: true}})

                // If we unhold this call, then all other calls
                // should be put on hold.
                for (let _callId of Object.keys(this.calls)) {
                    if (_callId !== callId) {
                        this.calls[_callId].setState({transfer: {active: false, type: 'accept'}})
                    }
                }
            } else {
                if (this.calls[callId].state.hold) this.calls[callId].unhold()
                this.calls[callId].setState({transfer: {active: false}})

                // If we unhold this call, then all other calls
                // should be put on hold.
                for (let _callId of Object.keys(this.calls)) {
                    if (_callId !== callId) {
                        this.calls[_callId].hold()
                        this.calls[_callId].setState({transfer: {active: false, type: 'attended'}})
                    }
                }
            }
        })

        this.app.on('bg:sip:connect', () => {
            this.connect()
        })

        this.app.on('bg:sip:disconnect', ({reconnect}) => {
            this.disconnect(reconnect)
        })

        this.connect()
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

        // Login with the WebRTC account and register.
        let uaOptions = this.uaOptions()
        if (!uaOptions.authorizationUser || !uaOptions.password) {
            this.app.logger.warn(`${this}cannot connect without username and password`)
            return
        }

        this.app.setState({sip: {ua: {state: 'disconnected'}}})

        this.ua = new this.lib.UA(uaOptions)
        this.presence = new Presence(this)

        // An incoming call. Set the session object and set state to call.
        this.ua.on('invite', (session) => {
            // For now, we don't support call-waiting. A new call that is
            // made when a call is already active will be silently dropped.
            if (Object.keys(this.calls).length > 0) {
                const call = new Call(this, session, {active: false, silent: true})
                call.terminate()
            } else {
                const call = new Call(this, session, {active: true})
                call.hasMedia.then(() => {
                    this.calls[call.state.id] = call
                })
            }
        })

        this.ua.on('registered', () => {
            this.app.setState({sip: {ua: {state: 'registered'}}})
            this.app.logger.info(`${this}SIP stack registered`)
            this.presence.update()
        })

        this.ua.on('unregistered', () => {
            this.app.setState({sip: {ua: {state: 'unregistered'}}})
            this.app.logger.info(`${this}SIP stack unregistered`)
        })

        this.ua.on('connected', () => {
            this.app.setState({sip: {ua: {state: 'connected'}}})
            this.app.logger.info(`${this}SIP stack started`)
        })


        this.ua.on('disconnected', () => {
            this.app.setState({sip: {ua: {state: 'disconnected'}}})
            this.app.logger.info(`${this}SIP stack stopped`)

            if (this.reconnect) {
                this.app.logger.debug(`${this}reconnecting ua`)
                this.connect()
            }
        })

        this.ua.on('registrationFailed', (reason) => {
            this.app.setState({sip: {ua: {state: 'registration_failed'}}})
        })
    }


    /**
    * Switch to the calldialog and start a new call.
    * @param {Number} number - The number to call.
    * @param {Object} options - The options to pass to the call.
    * @returns {Promise} - Call after it has access to media.
    */
    createCall(number, options) {
        return new Promise((resolve, reject) => {
            const call = new Call(this, number, options)
            call.hasMedia.then(() => {
                this.calls[call.state.id] = call
                this.app.setState({ui: {layer: 'calldialog'}})
                resolve(call)
            })
        })
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


    /**
    * Set the active state on the target call, un-hold the call and
    * put all other calls on-hold.
    * @param {Call} [call] - A Call to activate.
    * @param {Boolean} [holdInactive] - Unhold the call on activation.
    * @param {Boolean} [unholdActive] - Unhold the call on activation.
    * @returns {Call|Boolean} - The Call or false.
    */
    setActiveCall(call, holdInactive = true, unholdActive = false) {
        // Activate the first found call when no call is given.
        let activeCall = false
        const callIds = Object.keys(this.calls)

        if (!call) {
            for (const callId of callIds) {
                if (this.calls[callId].state.status !== 'bye') {
                    call = this.calls[callId]
                }
            }
            if (!call) return false
        }

        for (const callId of Object.keys(this.calls)) {
            // A call that is closing. Don't bother changing hold
            // and active state properties.
            if (call.state.status !== 'bye') {
                if (call.state.id === callId) {
                    activeCall = this.calls[callId]
                    this.calls[callId].setState({active: true})
                    if (unholdActive) this.calls[callId].unhold()
                } else {
                    this.calls[callId].setState({active: false})
                    if (holdInactive) this.calls[callId].hold()
                }
            }
        }
        return activeCall
    }


    toString() {
        return `${this.app}[sip] `
    }


    uaOptions() {
        const settings = this.app.state.settings
        // For webrtc this is a voipaccount, otherwise an email address.
        let uaOptions = {
            log: {
                builtinEnabled: false,
                debug: 'error',
            },
            stunServers: [
                'stun.voipgrid.nl',
            ],
            traceSip: false,
            userAgentString: process.env.PLUGIN_NAME,
            wsServers: [`wss://${settings.sipEndpoint}`],
        }

        // Log in with the WebRTC voipaccount when it is enabled.
        // The voipaccount should be from the same client as the logged-in
        // user, or subscribe information won't work.
        if (settings.webrtc.enabled) {
            uaOptions.authorizationUser = settings.webrtc.username
            uaOptions.password = settings.webrtc.password
            uaOptions.register = true
            uaOptions.uri = `sip:${settings.webrtc.username}@voipgrid.nl`
        } else {
            // Login with platform email without SIP register.
            uaOptions.authorizationUser = this.app.state.user.email
            uaOptions.password = this.app.state.user.password
            uaOptions.register = false
            uaOptions.uri = `sip:${this.app.state.user.email}`
        }

        return uaOptions
    }
}

module.exports = Sip
