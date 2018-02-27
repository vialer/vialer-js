const Call = require('./index')

/**
* Call implementation for incoming and outgoing calls
* using WebRTC and SIP.js.
*/
class CallSIP extends Call {

    constructor(module, target, options) {
        super(module, target, options)

        this._sessionOptions = {media: {}}
        if (!target || ['string', 'number'].includes(typeof target)) {
            module.app.__mergeDeep(this.state, {keypad: {mode: 'call'}, number: target, status: 'new', type: 'outgoing'})
        } else {
            // Passing in a session means an outgoing call.
            module.app.__mergeDeep(this.state, {keypad: {mode: 'dtmf'}, status: 'invite', type: 'incoming'})
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
            this.app.telemetry.event('call[sip]', 'incoming', 'rejected')

            // `e.method` is CANCEL when the incoming caller hung up.
            // `e` will be a SIP response 480 when the callee hung up.
            if (e.method === 'CANCEL') this.setState({status: 'rejected_b'})
            else this.setState({status: 'rejected_a'})
            this._stop({message: this.translations[this.state.status]})
        })

        this.session.on('bye', (e) => {
            if (e.getHeader('X-Asterisk-Hangupcausecode') === '58') {
                this.app.emit('fg:notify', {
                    icon: 'warning',
                    message: this.app.$t('Your VoIP-account requires AVPF and encryption support.'),
                    type: 'warning',
                })
            }

            this.setState({status: 'bye'})
            this.localVideo.srcObject = null
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
        this.session = this.ua.invite(`sip:${this.state.number}@voipgrid.nl`, this._sessionOptions)

        // Notify user about the new call being setup.
        this.session.on('accepted', (data) => {
            this.app.telemetry.event('call[sip]', 'outgoing', 'accepted')
            this.localVideo.srcObject = this.stream
            this.localVideo.play()
            this.localVideo.muted = true

            this.pc = this.session.sessionDescriptionHandler.peerConnection
            this.remoteStream = new MediaStream()

            this.pc.getReceivers().forEach((receiver) => {
                this.remoteStream.addTrack(receiver.track)
                this.remoteVideo.srcObject = this.remoteStream
                this.remoteVideo.play()
            })

            this._start({message: this.translations.accepted.outgoing})
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
            this.localVideo.srcObject = null
            this.setState({status: 'bye'})
            this._stop({message: this.translations[this.state.status]})
        })

        this.session.on('rejected', (e) => {
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
    * Accept an incoming session.
    */
    accept() {
        super.accept()
        this.session.accept(this._sessionOptions)
        this.pc = this.session.sessionDescriptionHandler.peerConnection

        this.session.sessionDescriptionHandler.on('addStream', () => {
            this.pc.getReceivers().forEach((receiver) => {
                this.remoteStream.addTrack(receiver.track)
                this.remoteVideo.srcObject = this.remoteStream
                this.remoteVideo.play()
            })
        })
    }


    hold() {
        if (this.session) {
            this.session.hold()
            this.setState({hold: {active: true}})
        }
    }


    start() {
        if (this.silent) {
            if (this.state.status === 'invite') this._incoming()
            else this._outgoing()
        } else {
            // Query media and assign the stream. The actual permission must be
            // already granted from a foreground script running in a tab.
            this.hasMedia = this._initMedia().then((stream) => {
                this._sessionOptions.media.stream = stream
                this.stream = stream
                if (this.state.status === 'invite') this._incoming()
                else this._outgoing()
            })
        }
    }


    /**
    * End a call based on it's current status.
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
            // Decrease the stop event delay, because the user is already
            // aware of the intend to end the call.
            this.setState({status: 'rejected_a'})
            this._stop({message: this.translations[this.state.status], timeout: 1500})
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
                this.app.logger.warn(`${this}unable to close the session properly.`)
            }
            this._stop({message: this.translations[this.state.status]})
        }
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
            this.session.unhold()
            this.setState({hold: {active: false}})
        }
    }
}

module.exports = CallSIP
