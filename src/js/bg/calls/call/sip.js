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
        if (!callTarget) Object.assign(this.state, {status: 'new', type: 'outgoing'})
        else if (['string', 'number'].includes(typeof callTarget)) {
            Object.assign(this.state, {number: callTarget, status: 'create', type: 'outgoing'})
        } else {
            Object.assign(this.state, {status: 'invite', type: 'incoming'})
            this.session = callTarget
        }
    }


    async _initMedia() {
        this._sessionOptions = {
            media: {},
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
            number: this.session.remoteIdentity.uri.user,
        })

        // Signal the user about the incoming call.
        if (!this.silent) {
            this.app.setState({ui: {layer: 'calldialog'}})
            this.app.logger.notification(
                this.app.$t('Incoming call'), `${this.state.number}: ${this.state.displayName}`, false)
            this.ringtone.play()
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
                this.app.emit('fg:notify', {icon: 'warning', message: this.app.$t('Your softphone account requires AVP and encryption'), type: 'warning'})
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
        for (const id of Object.keys(contacts)) {
            if (contacts[id].number === parseInt(this.number)) {
                this.setState({displayName: contacts[id].name})
            }
        }

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


    async transfer(targetCall, type) {
        if (type === 'blind') {
            this.session.refer(`sip:${targetCall}@voipgrid.nl`)
        } else if (type === 'attended') {
            // Option is a session. Refer to it and hang up.
            if (targetCall.constructor.name === 'CallSip') {
                this.session.refer(targetCall.session)
            } else {
                // targetCall is a number. Create a new call and set the
                // new call's transfer mode to accept.
                let call = this.module.startCall(null, targetCall, {active: true})
                call.setState({transfer: {type: 'accept'}})
                // Activate the new call's dialog. Don't hold inactive.
                this.module.setActiveCall(call, false)
            }
        }
    }


    unhold() {
        this.session.unhold()
        this.setState({hold: false})
    }
}

module.exports = CallSip
