const Call = require('./index')

/**
* Call flow wrapper around SipJS which enables incoming and outgoing
* calls using WebRTC.
*/
class CallSip extends Call {

    constructor(module, callTarget, options) {
        super(module, callTarget, options)

        this._sessionOptions = {media: {}}
        if (!callTarget) {
            // An outgoing call that is delayed(new) and has to be
            // started manually .
            module.app.__mergeDeep(this.state, {keypad: {mode: 'call'}, status: 'new', type: 'outgoing'})
        } else if (['string', 'number'].includes(typeof callTarget)) {
            module.app.__mergeDeep(this.state, {keypad: {mode: 'dtmf'}, number: callTarget, status: 'create', type: 'outgoing'})
        } else {
            module.app.__mergeDeep(this.state, {keypad: {mode: 'dtmf'}, status: 'invite', type: 'incoming'})
            this.session = callTarget
        }
    }


    /**
    * An invite; incoming call.
    */
    _handleIncoming() {
        this.state.displayName = this.session.remoteIdentity.displayName
        this.state.number = this.session.remoteIdentity.uri.user
        this.setState(this.state)

        // Signal the user about the incoming call.
        if (!this.silent) {
            this.app.setState({ui: {layer: 'calls', menubar: {event: 'ringing'}}})
            if (!this.app.state.ui.visible) {
                this.app.logger.notification(this.app.$t('Incoming call'), `${this.state.number}: ${this.state.displayName}`, false)
            }

            this.ringtone.play()
            this.module.activateCall(this, true)
        }

        // Setup some event handlers for the different stages of a call.
        this.session.on('accepted', (request) => {
            this._start()
        })

        this.session.on('rejected', (e) => {
            this.setState({status: 'rejected'})
            this._stop()
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
            this._stop()
        })

        // Blind transfer event.
        this.session.on('refer', (target) => {
            this.session.bye()
        })
    }


    /**
    * Setup an outgoing call.
    * @param {(Number|String)} number - The number to call.
    */
    _handleOutgoing() {
        this.session = this.ua.invite(`sip:${this.state.number}@voipgrid.nl`, this._sessionOptions)
        if (!this.silent) {
            // Always set this call to be the active call as soon a new
            // connection has been made.
            this.module.activateCall(this, true)
        }


        // The ua's displayName is empty for outgoing calls. Try to match it from contacts.
        const contacts = this.app.state.contacts.contacts
        let displayName = ''
        for (const id of Object.keys(contacts)) {
            if (contacts[id].number === parseInt(this.number)) {
                displayName = contacts[id].name
            }
        }
        // Status may still be `new` when the call is still empty.
        this.setState({displayName: displayName, status: 'create'})
        this.app.setState({ui: {layer: 'calls', menubar: {event: 'ringing'}}})

        // Notify user about the new call being setup.
        this.session.on('accepted', (data) => {
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

            this._start()
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
            this._stop()
        })

        this.session.on('rejected', (e) => {
            this.busyTone.play()
            this.setState({status: 'rejected'})
            this._stop()
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
        this.session.hold()
        this.setState({hold: true})
    }


    start() {
        if (this.silent) {
            if (this.state.status === 'invite') this._handleIncoming()
            else this._handleOutgoing()
        } else {
            // Query media and assign the stream. The actual permission must be
            // already granted from a foreground script running in a tab.
            this.hasMedia = this._initMedia().then((stream) => {
                this._sessionOptions.media.stream = stream
                this.stream = stream
                if (this.state.status === 'invite') this._handleIncoming()
                else this._handleOutgoing()
            })
        }
    }


    /**
    * End a call based on it's current status.
    */
    terminate() {
        try {
            if (this.state.status === 'invite') this.session.reject() // Decline an incoming call.
            else if (this.state.status === 'create') this.session.terminate() // Cancel a self-initiated call.
            else if (['accepted'].includes(this.state.status)) {
                // Hangup a running call.
                this.session.bye()
                // Set the status here manually, because the bye event on the
                // session is not triggered.
                this.setState({status: 'bye'})
            }
        } catch (err) {
            this.app.logger.warn(`${this}unable to close the session properly.`)
        }

        this._stop()
    }


    async transfer(targetCall) {
        if (typeof targetCall === 'string') {
            this.session.refer(`sip:${targetCall}@voipgrid.nl`)
        } else {
            this.session.refer(targetCall.session)
        }
    }


    unhold() {
        this.session.unhold()
        this.setState({hold: false})
    }
}

module.exports = CallSip
