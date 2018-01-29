/**
* Common Call class for Click-to-dial and WebRTC calling.
*/
class Call {

    constructor(sip, numberOrSession) {
        this.sip = sip
        this.app = this.sip.app
        this.ua = this.sip.ua

        this.ringtone = new this.app.sounds.RingTone(this.app.state.settings.ringtones.selected.name)
        this.ringbackTone = new this.app.sounds.RingbackTone(350, 440)
        // We can only match a call when the initial state already
        // includes it's id. This flag is used to inficate when
        // the foreground call state can be updated.
        this._trackState = false

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
            transfer: false,
            type: null, // incoming or outgoing
        }
    }


    /**
    * Mutate state only using this function. It takes care of merging a
    * state modification object with the current watched call object and
    * propagate the updated state back to the foreground.
    * @param {Object} state - The state to update.
    */
    setState(state) {
        this.app.mergeDeep(this.state, state)
        if (this._trackState) {
            this.app.emit('fg:set_state', {
                mount: {
                    id: this.state.id,
                    path: 'sip.calls',
                    type: 'array',
                },
                state: state,
            })
        } else {
            if (state.id) {
                this.state.id = state.id
                this.app.state.sip.calls.push(this.state)
                this.app.setState({sip: {calls: this.app.state.sip.calls}})
                this._trackState = true
            }
        }
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
