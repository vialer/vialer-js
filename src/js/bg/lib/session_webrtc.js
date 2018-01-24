const Session = require('./session')


/**
* A SipJS wrapper to handle incoming and outgoing calls.
*/
class WebRTCSession extends Session {

    constructor(sip, numberOrSession) {
        super(sip, numberOrSession)

        // Append the AV-elements in the background DOM, so the audio
        // can continue to play when the popup closes.
        if (!document.querySelector('.local') && !document.querySelector('.remote')) {
            this.localVideo = document.createElement('video')
            this.remoteVideo = document.createElement('video')
            this.localVideo.classList.add('local')
            this.remoteVideo.classList.add('remote')

            document.body.prepend(this.localVideo)
            document.body.prepend(this.remoteVideo)

            // Set the output device from settings.
            const sinks = this.app.state.settings.webrtc.sinks
            if (sinks.input.id) {
                this.app.logger.info(`setting sink id: ${sinks.output.id}`)
                this.remoteVideo.setSinkId(sinks.input.id).then(() => {

                }).catch((err) => {
                    this.app.emit('fg:notify', {message: 'Failed to set input device', type: 'danger'})
                })
            }

            if (sinks.output.id) {
                this.remoteVideo.setSinkId(sinks.output.id).then(() => {
                }).catch((err) => {
                    this.app.emit('fg:notify', {message: 'Failed to set output device', type: 'danger'})
                })
            }
        } else {
            // Reuse existing media elements.
            this.localVideo = document.querySelector('.local')
            this.remoteVideo = document.querySelector('.remote')
        }

        this._sessionOptions = {
            media: {},
            sessionDescriptionHandlerOptions: {
                constraints: {
                    audio: true,
                    video: false,
                },
            },
        }

        // The actual permission must be granted from a foreground script.
        navigator.mediaDevices.getUserMedia({audio: true}).then((stream) => {
            this._sessionOptions.media.stream = stream
            this.stream = stream

            if (numberOrSession.hasOwnProperty('acceptAndTerminate')) this.setupIncomingCall(numberOrSession)
            else this.setupOutgoingCall(numberOrSession)
        }).catch((err) => {
            throw err
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


    blindTransfer(number) {
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


    muteRingtone() {
        this.ringtone.stop()
    }


    playRingtone() {
        this.ringtone = new this.app.sounds.RingTone(this.app.state.settings.ringtones.selected.name)
        this.ringtone.play()
    }


    setupIncomingCall(session) {
        this.type = 'incoming'
        this.app.setState({sip: {session: {type: this.type}}})

        // An invite; incoming call.
        this.session = session
        this.displayName = this.session.remoteIdentity.displayName
        this.number = this.session.remoteIdentity.uri.user

        this.app.setState({
            sip: {
                displayName: this.displayName,
                number: this.number,
                session: {state: 'invite'},
            },
            ui: {layer: 'calldialog'},
        })

        this.app.logger.notification(`${this.app.$t('From')}: ${this.displayName}`, `${this.app.$t('Incoming call')}: ${this.number}`, false, 'warning')

        this.playRingtone()

        this.session.on('accepted', () => {
            this.app.setState({sip: {session: {state: 'accepted'}}})
            this.muteRingtone()
            this.startTimer()
        })

        this.session.on('rejected', () => {
            this.app.setState({sip: {session: {state: 'rejected'}}})
            this.muteRingtone()
            this.resetState()
        })

        this.session.on('bye', () => {
            this.app.setState({sip: {session: {state: 'bye'}}})
            this.localVideo.srcObject = null
            this.stopTimer()
            this.resetState()
        })

        // Blind transfer.
        this.session.on('refer', (target) => {
            this.session.bye()
        })
    }


    setupOutgoingCall(number) {
        this.type = 'outgoing'
        // An outgoing call.
        this.number = number
        this.session = this.ua.invite(`sip:${this.number}@voipgrid.nl`, this._sessionOptions)
        this.app.setState({sip: {number: this.number, session: {state: 'create', type: this.type}}})

        // Notify user that it's ringing.
        this.ringBackTone = new this.app.sounds.RingBackTone(350, 440)
        this.ringBackTone.play()

        this.session.on('accepted', (data) => {
            this.ringBackTone.stop()
            this.displayName = this.session.remoteIdentity.displayName
            this.app.setState({sip: {displayName: this.displayName, session: {state: 'accepted'}}})

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

            this.startTimer()
        })


        // Blind transfer.
        this.session.on('refer', (target) => {
            this.session.bye()
        })

        // Reset call state when the other halve hangs up.
        this.session.on('bye', (request) => {
            this.app.setState({sip: {session: {state: 'bye'}}})
            this.localVideo.srcObject = null
            this.stopTimer()
            this.resetState()
        })

        this.session.on('rejected', (request) => {
            this.app.setState({sip: {session: {state: 'rejected'}}})
            this.ringBackTone.stop()
            this.resetState()
        })
    }


    toggleTransferMode(active) {
        this.app.setState({sip: {session: {transfer: active}}})
    }


    unhold() {
        this.app.setState({sip: {session: {hold: false}}})
        this.session.unhold()
    }
}

module.exports = WebRTCSession
