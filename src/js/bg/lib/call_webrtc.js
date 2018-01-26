const Call = require('./call')


/**
* Call implementation which mainly wraps SipJS functionality to handle
( incoming and outgoing calls with.
*/
class CallWebRTC extends Call {

    constructor(sip, numberOrSession) {
        super(sip, numberOrSession)

        // Query media and assign the stream. The actual permission must be
        // already granted from a foreground script running in a tab.
        this._initMedia().then((stream) => {
            this._sessionOptions.media.stream = stream
            this.stream = stream

            if (numberOrSession.hasOwnProperty('acceptAndTerminate')) {
                this._handleIncoming(numberOrSession)
            } else {
                this._handleOutgoing(numberOrSession)
            }
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
    * @param {Session} session - A SipJS session.
    */
    _handleIncoming(session) {
        this.session = session
        this.type = 'incoming'
        this.displayName = this.session.remoteIdentity.displayName
        this.number = this.session.remoteIdentity.uri.user

        this.app.setState({
            sip: {
                displayName: this.displayName,
                number: this.number,
                session: {
                    state: 'invite',
                    type: this.type,
                },
            },
            ui: {layer: 'calldialog'},
        })
        // Notify the user about an incoming call.
        this.app.logger.notification(`${this.app.$t('From')}: ${this.displayName}`, `${this.app.$t('Incoming call')}: ${this.number}`, false, 'warning')
        this.ringtone.play()

        // Setup some event handlers for the different stages of a call.
        this.session.on('accepted', (request) => {
            console.log("ACCEPTED FROM INCOMING:")
            this.app.setState({sip: {session: {state: 'accepted'}}})
            this.ringtone.stop()
            this.startTimer()
        })

        this.session.on('rejected', (e) => {
            console.log("REJECTED FROM INCOMING:", e)
            this.app.setState({sip: {session: {state: 'rejected'}}})
            this.ringtone.stop()
            this.resetState()
        })

        this.session.on('bye', (e) => {
            console.log("BYE FROM INCOMING:", e)
            this.app.setState({sip: {session: {state: 'bye'}}})
            this.localVideo.srcObject = null
            this.stopTimer()
            this.resetState()
        })

        // Blind transfer event.
        this.session.on('refer', (target) => {
            console.log("REFER FROM INCOMING:", target)
            this.session.bye()
        })
    }


    /**
    * Setup an outgoing call.
    * @param {(Number|String)} number - The number to call.
    */
    _handleOutgoing(number) {
        this.type = 'outgoing'
        this.number = number
        this.session = this.ua.invite(`sip:${this.number}@voipgrid.nl`, this._sessionOptions)

        // Notify user about the new call being setup.
        this.app.setState({sip: {number: this.number, session: {state: 'create', type: this.type}}})
        this.ringbackTone.play()

        this.session.on('accepted', (data) => {
            this.ringbackTone.stop()
            this.displayName = this.session.remoteIdentity.displayName

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

            this.app.setState({sip: {displayName: this.displayName, session: {state: 'accepted'}}})
            this.startTimer()
        })


        // Blind transfer.
        this.session.on('refer', (target) => {
            console.log("REFER FROM OUTGOING:", target)
            this.session.bye()
        })

        // Reset call state when the other halve hangs up.
        this.session.on('bye', (e) => {
            console.log("BYE FROM OUTGOING:", e)
            this.app.setState({sip: {session: {state: 'bye'}}})
            this.localVideo.srcObject = null
            this.stopTimer()
            this.resetState()
        })

        this.session.on('rejected', (e) => {
            console.log("ACCEPTED FROM OUTGOING:", e)
            this.app.setState({sip: {session: {state: 'rejected'}}})
            this.ringtone.stop()
            this.resetState()
        })
    }


    /**
    * Accept an incoming session.
    */
    answer() {
        if (!(this.type === 'incoming')) throw 'session must be incoming type'
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


    transferAttended(number) {
        this.session_transfer = ''
    }


    transferBlind(number) {
        this.session.refer(`sip:${number}@voipgrid.nl`)
    }


    /**
    * Hangup a call.
    */
    hangup() {
        if (this.state.session.state === 'invite') {
            // Decline an incoming call.
            this.session.reject()
        } else if (this.state.session.state === 'create') {
            // Cancel a self-initiated call.
            this.session.terminate()
        } else if (['accepted'].includes(this.state.session.state)) {
            // Hangup a running call.
            this.session.bye()
            // The bye event on the session is not triggered.
            this.app.setState({sip: {session: {state: 'bye'}}})
        }
    }


    hold() {
        this.app.setState({sip: {session: {hold: true}}})
        this.session.hold()
    }


    unhold() {
        this.app.setState({sip: {session: {hold: false}}})
        this.session.unhold()
    }
}

module.exports = CallWebRTC
