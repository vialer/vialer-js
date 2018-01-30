const Call = require('./call')


/**
* Call flow wrapper around SipJS which enables incoming and outgoing
* calls using WebRTC.
*/
class CallWebRTC extends Call {

    constructor(sip, callTarget, options) {
        super(sip, callTarget, options)

        if (callTarget.hasOwnProperty('acceptAndTerminate')) {
            Object.assign(this.state, {status: 'invite', type: 'incoming'})
            this.session = callTarget
        } else {
            Object.assign(this.state, {status: 'create', type: 'outgoing'})
        }

        if (this.silent) {
            if (this.state.status === 'invite') this._handleIncoming(callTarget)
            else this._handleOutgoing(callTarget)
            return
        }
        // Query media and assign the stream. The actual permission must be
        // already granted from a foreground script running in a tab.
        this.hasMedia = this._initMedia().then((stream) => {
            this._sessionOptions.media.stream = stream
            this.stream = stream

            if (this.state.status === 'invite') this._handleIncoming(callTarget)
            else this._handleOutgoing(callTarget)
        })
    }


    async _initMedia() {
        this._sessionOptions = {
            media: {},
            sessionDescriptionHandlerOptions: {
                constraints: {
                    audio: true,
                    video: false,
                },
            },
        }

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
        this.setState({
            displayName: this.session.remoteIdentity.displayName,
            id: this.session.id,
            number: this.session.remoteIdentity.uri.user,
        })

        this.app.setState({ui: {layer: 'calldialog'}})
        // Signal the user about the incoming call.
        this.app.logger.notification(
            `${this.app.$t('From')}: ${this.state.displayName}`,
            `${this.app.$t('Incoming call')}: ${this.state.number}`, false, 'warning')

        if (!this.silent) this.ringtone.play()

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
    _handleOutgoing(number) {
        this.session = this.ua.invite(`sip:${number}@voipgrid.nl`, this._sessionOptions)
        this.setState({id: this.session.id, number: number})
        // Notify user about the new call being setup.
        this.ringbackTone.play()

        this.session.on('accepted', (data) => {
            // Always set this call to be the active call as soon a new
            // connection has been made.
            this.sip.setActiveCall(this, true)
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

            this.setState({displayName: this.session.remoteIdentity.displayName, status: 'accepted'})
            this.startTimer()
        })


        // Blind transfer.
        this.session.on('refer', (target) => {
            this.session.bye()
        })

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


    async transfer(callTarget, type) {
        if (type === 'blind') {
            this.session.refer(`sip:${callTarget}@voipgrid.nl`)
        } else if (type === 'attended') {
            // Option is a session. Refer to it and hang up.
            if (callTarget.constructor.name === 'CallWebRTC') {
                this.session.refer(callTarget.session)
            } else {
                // callTarget is a number. Create a new call and set the
                // new call's transfer mode to accept.
                let call = await this.sip.createCall(callTarget)
                call.setState({transfer: {type: 'accept'}})
                // Activate the new call's dialog.
                this.sip.setActiveCall(call,)
            }
        }
    }


    unhold() {
        this.session.unhold()
        this.setState({hold: false})
    }
}

module.exports = CallWebRTC
