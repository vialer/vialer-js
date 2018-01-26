/**
* Common Call class for Click-to-dial and WebRTC calling.
*/
class Call {

    constructor(sip, numberOrSession) {
        this.sip = sip

        this.app = this.sip.app
        this.ua = this.sip.ua
        this.state = this.app.state.sip
        this.ringtone = new this.app.sounds.RingTone(this.app.state.settings.ringtones.selected.name)
        this.ringbackTone = new this.app.sounds.RingbackTone(350, 440)

        this.state = {
            displayName: null,
            hold: false,
            id: null,
            number: '',
            status: null,
            timer: {
                current: null,
                start: null,
            },
            type: null,
        }
        // Allow Vue to keep track of the call state.
        this.app.state.sip.calls.push(this.state)
    }


    /**
    * Synchronizes call state with the foreground. The next best thing
    * f
    * @param {Object} state - The state to update.
    */
    setState(state) {
        this.app.mergeDeep(this.state, state)
        this.app.emit('fg:set_state', state)
    }


    startTimer() {
        this.setState({timer: {current: new Date().getTime(), start: new Date().getTime()}})
        this.timerId = window.setInterval(() => {
            this.setState({timer: {current: new Date().getTime()}})
        }, 1000)
    }


    stopTimer() {
        clearInterval(this.timerId)
        this.setState({timer: {current: null, start: null}})
    }


    /**
    * Takes care of returning to a state before the call
    * was made. Make sure you set the final state of a call
    * before calling cleanup. The timeout is meant to postpone
    * resetting the state, in order to give the user a hint of
    * what happened in between.
    * @param {Number} timeout - Postpones resetting of the call state.
    */
    cleanup(timeout = 3000) {
        // Stop all sounds.
        this.ringbackTone.stop()
        this.ringtone.stop()
        this.stopTimer()

        window.setTimeout(() => {
            const defaultState = this.app.getDefaultState().sip
            let newSipState = {}
            for (const key of Object.keys(this.app.state.sip)) {
                // We keep these state properties.
                if (!['ua'].includes(key)) {
                    newSipState[key] = defaultState[key]
                }
            }
            // Propagate to the foreground.
            this.app.setState({sip: newSipState})
            delete this.sip.calls[this.session.id]
        }, timeout)
    }
}


module.exports = Call
