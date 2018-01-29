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

        // The default connection timeout to start with.
        this.retryDefault = {interval: 2500, limit: 9000000}
        // Used to store retry state.
        this.retry = Object.assign({}, this.retryDefault)

        // Start with a clean state.
        this.app.setState({sip: this.app.getDefaultState().sip})

        this.app.on('bg:sip:call_answer', ({callId}) => {
            this.calls[callId].answer()
        })

        // Self-initiated request to stop the session during one of
        // the phases of a call.
        this.app.on('bg:sip:call_terminate', ({callId}) => {
            this.calls[callId].terminate()
        })

        this.app.on('bg:sip:call', ({number}) => {
            this.createCall(number)
        })

        this.app.on('bg:sip:dtmf', ({key}) => {
            this.call.session.dtmf(key)
        })

        this.app.on('bg:sip:toggle_hold', () => {
            if (!this.state.session.hold) this.call.hold()
            else this.call.unhold()
        })

        this.app.on('bg:sip:transfer', ({number, type}) => {
            if (type === 'blind') {
                this.call.transferBlind(number)
            } else {
                this.call.transferAttended(number)
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
            const call = new Call(this, session)
            call.hasMedia.then(() => {
                this.calls[call.state.id] = call
            })
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
    */
    createCall(number) {
        const call = new Call(this, number)
        call.hasMedia.then(() => {
            this.calls[call.session.id] = call
            console.log('STATE:', call.state)
            this.app.setState({ui: {layer: 'calldialog'}})
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


    toString() {
        return `${this.app}[sip] `
    }
}

module.exports = Sip
