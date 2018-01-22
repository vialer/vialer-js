const Session = require('./session_webrtc')
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

        // This flag indicates whether a reconnection attempt will be
        // made when the websocket connection is gone.
        this.reconnect = true
        this.state = this.app.state.sip


        // The default connection timeout to start with.
        this.retryDefault = {interval: 2500, limit: 9000000}
        // Used to store retry state.
        this.retry = Object.assign({}, this.retryDefault)

        // Append the AV-elements in the background DOM, so the audio
        // can still be played after the popup closes.
        this.localVideo = document.createElement('video')
        this.remoteVideo = document.createElement('video')
        this.localVideo.classList.add('local')
        this.remoteVideo.classList.add('remote')

        document.body.prepend(this.localVideo)
        document.body.prepend(this.remoteVideo)

        // Start with a clean state.
        this.app.setState({sip: this.app.getDefaultState().sip})

        this.app.on('bg:sip:accept_session', () => {
            this.session.answer()
        })

        this.app.on('bg:sip:dtmf', ({key}) => {
            this.session.session.dtmf(key)
        })

        this.app.on('bg:sip:toggle_hold', () => {
            if (!this.state.session.hold) this.session.hold()
            else this.session.unhold()
        })

        this.app.on('bg:sip:toggle_transfer', () => {
            if (!this.state.session.transfer) {
                this.session.hold()
                this.session.toggleTransferMode(true)
            } else {
                this.session.toggleTransferMode(false)
            }
        })

        this.app.on('bg:sip:blind_transfer', ({number}) => {
            this.session.blindTransfer(number)
        })

        // Self-initiated request to stop the session during one of
        // the phases of a call.
        this.app.on('bg:sip:stop_session', () => {
            this.session.hangup()
        })

        this.connect()
    }


    /**
    * Init and start a new stack, connecting
    * SipML5 to the websocket SIP backend.
    */
    connect() {
        // Emit to the frontend that the sip client is not yet
        // ready to start.
        if (this.ua && this.ua.isConnected()) {
            this.app.logger.warn(`${this}sip backend already starting or started`)
            return
        }
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

        // Login with the WebRTC account and register.
        if (settings.webrtc.enabled) {
            uaOptions.authorizationUser = settings.webrtc.username
            uaOptions.password = settings.webrtc.password
            uaOptions.register = true
            uaOptions.uri = `sip:${settings.webrtc.username}@voipgrid.nl`
        } else {
            // Login with platform email without register.
            uaOptions.authorizationUser = this.app.state.user.email
            uaOptions.password = this.app.state.user.password
            uaOptions.register = false
            uaOptions.uri = `sip:${this.app.state.user.email}`
        }

        if (!uaOptions.authorizationUser || !uaOptions.password) {
            this.app.logger.warn(`${this}cannot connect without username and password`)
            return
        }

        this.app.setState({sip: {ua: {state: 'disconnected'}}})

        this.ua = new this.lib.UA(uaOptions)

        // An incoming call. Set the session object and set state to call.
        this.ua.on('invite', (session) => {
            this.session = new Session(this, session)
        })

        this.ua.on('registered', () => {
            this.app.setState({sip: {ua: {state: 'registered'}}})
            this.app.logger.info(`${this}SIP stack registered`)
        })

        this.ua.on('unregistered', () => {
            this.app.setState({sip: {ua: {state: 'unregistered'}}})
            this.app.logger.info(`${this}SIP stack unregistered`)
        })

        this.ua.on('connected', () => {
            this.presence = new Presence(this)
            this.app.setState({sip: {ua: {state: 'connected'}}})
            this.app.logger.info(`${this}SIP stack started`)
        })


        this.ua.on('disconnected', () => {
            this.app.setState({sip: {ua: {state: 'disconnected'}}})
            this.app.logger.info(`${this}SIP stack stopped`)

            if (this.reconnect) {
                this.app.logger.debug(`${this}reconnecting ua`)
                this.ua.start()
            }
        })
    }


    call(number) {
        this.session = new Session(this, number)
    }


    /**
    * Graceful stop, do not reconnect automatically.
    * @param {Boolean} reconnect - Whether try to reconnect.
    */
    disconnect(reconnect = true) {
        this.reconnect = reconnect

        if (this.ua && this.ua.isConnected()) {
            this.ua.stop()
            this.app.logger.debug(`${this}disconnected`)
        } else {
            this.app.logger.debug(`${this}not connection to stop`)
        }
    }


    toString() {
        return `${this.app}[sip] `
    }


}

module.exports = Sip
