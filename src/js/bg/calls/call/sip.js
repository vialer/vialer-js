const Call = require('./index')

/**
* Call flow wrapper around SipJS which enables incoming and outgoing
* calls using WebRTC.
*/
class CallSip extends Call {

    constructor(module, callTarget, options) {
        super(module, callTarget, options)
        // Handle three cases: incoming call; outgoing call (instant start) and
        // delayed outgoing call.
        if (!callTarget) {
            module.app.__mergeDeep(this.state, {keypad: {mode: 'call'}, status: 'new', type: 'outgoing'})
        } else if (['string', 'number'].includes(typeof callTarget)) {
            module.app.__mergeDeep(this.state, {keypad: {mode: 'dtmf'}, number: callTarget, status: 'create', type: 'outgoing'})
        } else {
            module.app.__mergeDeep(this.state, {keypad: {mode: 'dtmf'}, status: 'invite', type: 'incoming'})
            this.session = callTarget
        }
    }


    async _initMedia() {
        this._sessionOptions = {media: {}}

        // Append the AV-elements in the background DOM, so the audio
        // can continue to play when the popup closes.
        if (document.querySelector('.local') && document.querySelector('.remote')) {
            // Reuse existing media elements.
            this.localVideo = document.querySelector('.local')
            this.remoteVideo = document.querySelector('.remote')
        } else {
            this.localVideo = document.createElement('video')
            this.remoteVideo = document.createElement('video')
            this.localVideo.classList.add('local')
            this.remoteVideo.classList.add('remote')
            document.body.prepend(this.localVideo)
            document.body.prepend(this.remoteVideo)
        }

        // Set the output device from settings.
        const sinks = this.app.state.settings.webrtc.sinks
        try {
            if (sinks.input.id) this.remoteVideo.setSinkId(sinks.input.id)
            if (sinks.output.id) await this.remoteVideo.setSinkId(sinks.output.id)
        } catch (err) {
            this.app.emit('fg:notify', {message: 'Failed to set input or output device.', type: 'danger'})
        }

        return navigator.mediaDevices.getUserMedia({audio: true})
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
            this.app.setState({ui: {layer: 'calls'}})
            this.app.logger.notification(
                this.app.$t('Incoming call'), `${this.state.number}: ${this.state.displayName}`, false)
            this.ringtone.play()
            this.module.setActiveCall(this, true)
        }

        // Setup some event handlers for the different stages of a call.
        this.session.on('accepted', (request) => {
            this.setState({status: 'accepted'})
            this.startTimer()
            this.ringtone.stop()
        })

        this.session.on('rejected', (e) => {
            this.setState({status: 'rejected'})
            this.cleanup()
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
            this.cleanup()
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
            this.module.setActiveCall(this, true)
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

        // Notify user about the new call being setup.
        this.session.on('accepted', (data) => {
            this.ringbackTone.stop()

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

            this.setState({status: 'accepted'})
            this.startTimer()
        })

        this.session.on('progress', (e) => {
            // Ringing, start ringing.
            if (e.status_code === 180) {
                this.ringbackTone.play()
            }
        })


        // Blind transfer.
        this.session.on('refer', (target) => this.session.bye())

        // Reset call state when the other halve hangs up.
        this.session.on('bye', (e) => {
            this.localVideo.srcObject = null
            this.setState({status: 'bye'})
            this.cleanup()
        })

        this.session.on('rejected', (e) => {
            this.setState({status: 'rejected'})
            this.cleanup()
        })
    }


    /**
    * Accept an incoming session.
    */
    answer() {
        if (!(this.state.type === 'incoming')) throw 'session must be incoming type'
        this.session.accept(this._sessionOptions)

        this.localVideo.srcObject = this.stream
        this.localVideo.play()
        this.localVideo.muted = true

        this.pc = this.session.sessionDescriptionHandler.peerConnection
        this.remoteStream = new MediaStream()

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
    * Hangup a call.
    */
    terminate() {
        if (this.state.status === 'invite') {
            // Decline an incoming call.
            this.session.reject()
        } else if (this.state.status === 'create') {
            // Cancel a self-initiated call.
            this.session.terminate()
        } else if (['accepted'].includes(this.state.status)) {
            // Hangup a running call.
            this.session.bye()
            // The bye event on the session is not triggered.
            this.setState({status: 'bye'})
        }
        this.cleanup()
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
