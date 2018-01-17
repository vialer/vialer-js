const Session = require('./session')
const transform = require('sdp-transform')


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
    * Prefer to use G722.
    * @param {String} description - sdp description.
    * @returns {Object} - The modified sdp.
    */
    _formatSdp(description) {
        let blacklistCodecs = ['PCMU', 'PCMA']
        let sdpObj = transform.parse(description.sdp)
        // console.log(sdpObj)
        description.sdp = transform.write(sdpObj)
        let rtpMedia = []
        let payloads = []
        for (let codec of sdpObj.media[0].rtp) {
            if (!blacklistCodecs.includes(codec.codec)) {
                rtpMedia.push(codec)
                payloads.push(codec.payload)
            }
        }

        sdpObj.media[0].payloads = payloads.join(' ')
        sdpObj.media[0].rtp = rtpMedia
        description.sdp = transform.write(sdpObj)
        // description.sdp = description.sdp.replace(/^a=candidate:\d+ \d+ tcp .*?\r\n/img, "")
        return Promise.resolve(description)
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
        // An invite; incoming call.
        this.session = session
        this.displayName = this.session.remoteIdentity.displayName
        this.number = this.session.request.ruri.aor.split('@')[0]

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
        // An outgoing call.
        this.number = number
        this.session = this.ua.invite(`sip:${this.number}@voipgrid.nl`, this._sessionOptions, this._formatSdp)
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
            this.displayName = data.from.uri.user
            this.app.setState({
                sip: {
                    displayName: data.from.uri.user,
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
