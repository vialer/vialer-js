/**
* Common Session class for Click-to-dial and WebRTC calling.
*/
class Session {

    constructor(...args) {
        Object.assign(this, args)
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
