const Session = require('./session')


/**
* A SipJS wrapper to handle incoming and outgoing calls.
*/
class WebRTCSession extends Session {

    constructor(sip, numberOrSession) {
        super(app, sip, numberOrSession)

        this.app = sip.app
        this.ua = sip.ua
        this.state = this.app.state.sip

        this.localVideo = document.querySelector('.local')
        this.remoteVideo = document.querySelector('.remote')

        this._sessionOptions = {
            sessionDescriptionHandlerOptions: {
                constraints: {
                    audio: true,
                    video: false,
                },
            },
        }

        // The actual permission must be granted from a foreground script.
        navigator.mediaDevices.getUserMedia({audio: true}).then((stream) => {
            this.stream = stream
        }).catch((err) => {
            throw err
        })

        if (numberOrSession.hasOwnProperty('acceptAndTerminate')) this.setupIncomingCall(numberOrSession)
        else this.setupOutgoingCall(numberOrSession)
    }


    /**
    * Accept an incoming session.
    */
    answer() {
        if (!this.type === 'incoming') throw 'session must be incoming type'
        this.session.accept(this._sessionOptions)

        this.localVideo.srcObject = this.stream
        this.localVideo.play()

        this.pc = this.session.sessionDescriptionHandler.peerConnection
        this.remoteStream = new MediaStream()

        this.pc.getReceivers().forEach((receiver) => {
            this.remoteStream.addTrack(receiver.track)
            this.remoteVideoElement.srcObject = this.remoteStream
            this.remoteVideoElement.play()
        })
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
        })

        this.playRingtone()

        this.session.on('accepted', () => {
            this.app.setState({sip: {session: {state: 'accepted'}}})
            this.muteRingtone()
        })

        this.session.on('rejected', () => {
            this.app.setState({sip: {session: {state: 'rejected'}}})
            this.muteRingtone()
            this.resetState()
        })

        this.session.on('bye', () => {
            this.app.setState({sip: {session: {state: 'bye'}}})
            this.resetState()
            this.localVideo.srcObject = null
        })
    }


    setupOutgoingCall(number) {
        this.type = 'outgoing'
        this.app.setState({sip: {session: {type: this.type}}})
        // An outgoing call.
        this.number = number
        this.session = this.ua.invite(`sip:${this.number}@voipgrid.nl`, this._sessionOptions)
        this.app.setState({
            sip: {
                number: this.number,
                session: {state: 'create'},
            },
        })

        // Notify user that it's ringing.
        const ringBackTone = new this.app.sounds.RingBackTone(350, 440)
        ringBackTone.play()
        this.session.on('accepted', (data) => {
            ringBackTone.stop()
            // Displayname
            this.displayName = this.session.remoteIdentity.displayName
            this.app.setState({
                sip: {
                    displayName: this.displayName,
                    session: {state: 'accepted'},
                },
            })

            this.localVideo.srcObject = this.stream
            this.localVideo.play()

            this.pc = this.session.sessionDescriptionHandler.peerConnection
            this.remoteStream = new MediaStream()

            this.pc.getReceivers().forEach((receiver) => {
                this.remoteStream.addTrack(receiver.track)
                this.remoteVideo.srcObject = this.remoteStream
                this.remoteVideo.play()
            })
        })


        // Reset call state when the other halve hangs up.
        this.session.on('bye', (request) => {
            this.app.setState({sip: {session: {state: 'bye'}}})
            this.resetState()
            this.localVideo.srcObject = null
        })

        this.session.on('rejected', (request) => {
            this.app.setState({sip: {session: {state: 'rejected'}}})
            this.resetState()
            ringBackTone.stop()
        })
    }
}

module.exports = WebRTCSession
