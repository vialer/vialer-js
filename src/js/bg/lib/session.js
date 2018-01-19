/**
* Common Session class for Click-to-dial and WebRTC calling.
*/
class Session {

    constructor(sip, numberOrSession) {
        this.sip = sip

        this.app = this.sip.app
        this.ua = this.sip.ua
        this.state = this.app.state.sip
    }


    startTimer() {
        this.app.setState({sip: {session: {timer: {current: new Date().getTime(), start: new Date().getTime()}}}})
        this.timerId = window.setInterval(() => {
            this.app.setState({sip: {session: {timer: {current: new Date().getTime()}}}})
        }, 1000)
    }


    stopTimer() {
        clearInterval(this.timerId)
        this.app.setState({sip: {session: {timer: {current: null, start: null}}}})
    }


    resetState() {
        window.setTimeout(() => {
            this.app.setState({sip: this.app.getDefaultState().sip})
            delete this.session
        }, 3000)
    }
}


module.exports = Session
