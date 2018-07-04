/**
* @module ModuleCalls
*/
const Call = require('./index')

/**
* Call implementation for incoming and outgoing calls
* using WebRTC and SIP.js.
*/
class CallSIP extends Call {
    /**
    * @param {AppBackground} app - The background application.
    * @param {String|Number|Session} [target] - An endpoint identifier to call to.
    * @param {Object} [options] - An endpoint identifier to call to.
    * @param {Boolean} [options.active] - Activates this Call in the UI.
    * @param {Boolean} [options.silent] - Setup a Call without interfering with the UI.
    */
    constructor(app, target, {active, silent} = {}) {
        super(app, target, {active, silent})

        if (!target || ['string', 'number'].includes(typeof target)) {
            app.__mergeDeep(this.state, {keypad: {mode: 'call'}, number: target, status: 'new', type: 'outgoing'})
        } else {
            // Passing in a session means an outgoing call.
            app.__mergeDeep(this.state, {keypad: {mode: 'dtmf'}, status: 'invite', type: 'incoming'})
            this.session = target
        }
    }


    /**
    * Handle an incoming `invite` call from.
    */
    _incoming() {
        // (!) First set the state before calling super.
        this.state.displayName = this.session.remoteIdentity.displayName
        this.state.number = this.session.remoteIdentity.uri.user
        super._incoming()

        // Setup some event handlers for the different stages of a call.
        this.session.on('accepted', (request) => {
            this.app.telemetry.event('call[sip]', 'incoming', 'accepted')
            this._start({message: this.translations.accepted.incoming})
        })

        this.session.on('rejected', (e) => {
            // The `e` is a SIP header string when the callee hangs up,
            // otherwise it is an object. If it is an object, we can distinguish
            // several rejected reasons from each other from the headers.
            if (typeof e === 'object') {
                const reason = this._parseHeader(e.getHeader('reason'))

                if (reason.get('text') === 'Call completed elsewhere') {
                    this.app.telemetry.event('call[sip]', 'incoming', 'answered_elsewhere')
                    this.setState({status: 'answered_elsewhere'})
                } else {
                    // `Call completed elsewhere` is not considered to be
                    // a missed call and will not end up in the activity log.
                    this.app.emit('bg:calls:call_rejected', {call: this.state}, true)
                    this.app.telemetry.event('call[sip]', 'incoming', 'rejected')
                    // `e.method` is CANCEL when the incoming caller hung up.
                    // `e` will be a SIP response 480 when the callee hung up.
                    if (e.method === 'CANCEL') this.setState({status: 'rejected_b'})
                    else this.setState({status: 'rejected_a'})
                }
            } else {
                this.app.emit('bg:calls:call_rejected', {call: this.state}, true)
                this.app.telemetry.event('call[sip]', 'incoming', 'rejected')
            }

            this._stop({message: this.translations[this.state.status]})
        })

        this.session.on('bye', (e) => {
            if (e.getHeader('X-Asterisk-Hangupcausecode') === '58') {
                this.app.notify({
                    icon: 'warning',
                    message: this.app.$t('your VoIP account misses AVPF and encryption support.'),
                    type: 'warning',
                })
            }

            this.setState({status: 'bye'})
            this._stop({message: this.translations[this.state.status]})
        })

        // Blind transfer event.
        this.session.on('refer', (target) => this.session.bye())
    }


    /**
    * Setup an outgoing call.
    * @param {(Number|String)} number - The number to call.
    */
    _outgoing() {
        super._outgoing()
        this.session = this.module.ua.invite(`sip:${this.state.number}@voipgrid.nl`, {
            sessionDescriptionHandlerOptions: {
                constraints: this.app._getUserMediaFlags(),
            },
        })

        // Notify user about the new call being setup.
        this.session.on('accepted', (data) => {
            this.app.telemetry.event('call[sip]', 'outgoing', 'accepted')
            this._start({message: this.translations.accepted.outgoing})
        })

        // Handle connecting streams to the appropriate video element.
        this.session.on('trackAdded', async() => {
            this.localStream = new MediaStream()
            this.remoteStream = new MediaStream()

            this.pc = this.session.sessionDescriptionHandler.peerConnection
            this.pc.getReceivers().forEach((receiver) => this.remoteStream.addTrack(receiver.track))
            this.app.remoteVideo.srcObject = this.remoteStream

            this.pc.getSenders().forEach((sender) => this.localStream.addTrack(sender.track))
            this.app.localVideo.srcObject = this.localStream
        })

        /**
        * Play a ringback tone on the following status codes:
        * 180: Ringing
        * 181: Call is Being Forwarded
        * 182: Queued
        * 183: Session in Progress
        */
        this.session.on('progress', (e) => {
            if ([180, 181, 182, 183].includes(e.status_code)) {
                this.ringbackTone.play()
            }
        })

        // Blind transfer.
        this.session.on('refer', (target) => this.session.bye())
        // Reset call state when the other halve hangs up.
        this.session.on('bye', (e) => {
            this.setState({status: 'bye'})
            this._stop({message: this.translations[this.state.status]})
        })

        this.session.on('rejected', (e) => {
            this.app.emit('bg:calls:call_rejected', {call: this.state}, true)
            this.app.telemetry.event('call[sip]', 'outgoing', 'rejected')
            this.busyTone.play()

            // Busy here; Callee is busy.
            if (e.status_code === 486) this.setState({status: 'rejected_b'})
            // Request terminated; Request has terminated by bye or cancel.
            else if (e.status_code === 487) this.setState({status: 'rejected_a'})
            // Just assume that Callee rejected the call otherwise.
            else this.setState({status: 'rejected_b'})
            this._stop({message: this.translations[this.state.status]})
        })
    }


    /**
    * Convert a comma-separated string like:
    * `SIP;cause=200;text="Call completed elsewhere` to a Map.
    * @param {String} header - The header to parse.
    * @returns {Map} - A map of key/values of the header.
    */
    _parseHeader(header) {
        return new Map(header.replace(/\"/g, '').split(';').map((i) => i.split('=')))
    }


    /**
    * Accept an incoming session.
    */
    accept() {
        super.accept()

        // Handle connecting streams to the appropriate video element.
        this.session.on('trackAdded', () => {
            this.localStream = new MediaStream()
            this.remoteStream = new MediaStream()

            this.pc = this.session.sessionDescriptionHandler.peerConnection
            this.pc.getReceivers().forEach((receiver) => this.remoteStream.addTrack(receiver.track))
            this.app.remoteVideo.srcObject = this.remoteStream

            this.pc.getSenders().forEach((sender) => this.localStream.addTrack(sender.track))
            this.app.localVideo.srcObject = this.localStream
        })
        this.session.accept({
            sessionDescriptionHandlerOptions: {
                constraints: this.app._getUserMediaFlags(),
            },
        })
    }


    hold() {
        if (this.session) {
            this.session.hold({
                sessionDescriptionHandlerOptions: {
                    constraints: this.app._getUserMediaFlags(),
                },
            })
            this.setState({hold: {active: true}})
        }
    }


    async start() {
        if (this.silent) {
            if (this.state.status === 'invite') this._incoming()
            else this._outgoing()
        } else {
            // Query media and assign the stream. The actual permission must be
            // already granted from a foreground script running in a tab.
            try {
                await this._initMedia()
                if (this.state.status === 'invite') this._incoming()
                else this._outgoing()
            } catch (err) {
                console.error(err)
            }
        }
    }


    /**
    * Terminate a Call depending on it's current status.
    */
    terminate() {
        if (this.state.status === 'new') {
            // An empty/new call; just delete the Call object without noise.
            this.module.deleteCall(this)
            return
        } else if (this.state.status === 'create') {
            // A fresh outgoing Call; not yet started. There may or may not
            // be a session object. End the session if there is one.
            if (this.session) this.session.terminate()
            this.setState({status: 'rejected_a'})
            // The session's closing events will not be called, so manually
            // trigger the Call to stop here.
            this._stop()
        } else {

            // Calls with other statuses need some more work to end.
            try {
                if (this.state.status === 'invite') {
                    this.setState({status: 'rejected_a'})
                    this.session.reject() // Decline an incoming call.
                } else if (['accepted'].includes(this.state.status)) {
                    // Hangup a running call.
                    this.session.bye()
                    // Set the status here manually, because the bye event on the
                    // session is not triggered.
                    this.setState({status: 'bye'})
                }
            } catch (err) {
                this.app.logger.warn(`${this}unable to close the session properly. (${err})`)
                // Get rid of the Call anyway.
                this._stop()
            }
        }
    }


    /**
    * Generate a representational name for this module. Used for logging.
    * @returns {String} - An identifier for this module.
    */
    toString() {
        return `${this.app}[CallSIP][${this.id}] `
    }


    transfer(targetCall) {
        if (typeof targetCall === 'string') {
            this.session.refer(`sip:${targetCall}@voipgrid.nl`)
        } else {
            this.session.refer(targetCall.session)
        }
    }


    unhold() {
        if (this.session) {
            this.session.unhold({
                sessionDescriptionHandlerOptions: {
                    constraints: this.app._getUserMediaFlags(),
                },
            })
            this.setState({hold: {active: false}})
        }
    }
}

module.exports = CallSIP
