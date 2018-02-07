/**
* Common Call class for Click-to-dial and WebRTC calling.
*/
class Call {

    constructor(module, callTarget, {active, silent} = {}) {
        this.module = module
        this.app = this.module.app
        this.ua = this.module.ua
        this.silent = silent

        this.ringtone = new this.app.sounds.RingTone(this.app.state.settings.ringtones.selected.name)
        this.ringbackTone = new this.app.sounds.RingbackTone()
        // The call state can be tracked between fg and bg after the
        // call's session id is known. This flag is used to indicate
        // when the state can be synced in `setState`.
        this._trackState = false
        this.id = this.generateUUID()

        this.state = {
            active: false,
            displayName: null,
            hold: false,
            id: this.id,
            keypad: {
                active: false,
                display: 'touch', // 'dense' or 'touch'
                mode: 'dtmf', // 'call' or 'dtmf'
                number: null,
            },
            number: null,
            silent: this.silent,
            status: null,
            timer: {
                current: null,
                start: null,
            },
            transfer: {
                active: false,
                type: 'attended',
            },
            type: null, // incoming or outgoing
        }

        if (!this.silent) {
            Vue.set(this.app.state.calls.calls, this.id, this.state)
            this.app.emit('fg:set_state', {action: 'insert', path: `calls/calls/${this.id}`, state: this.state})
        }
    }


    /**
    * Takes care of returning to a state before the call
    * was made. Make sure you set the final state of a call
    * before calling cleanup. The timeout is meant to postpone
    * resetting the state, in order to give the user a hint of
    * what happened in between.
    * @param {Number} timeout - Postpones resetting of the call state.
    */
    cleanup(timeout = 1500) {
        // Stop all sounds.
        this.ringbackTone.stop()
        this.ringtone.stop()
        this.stopTimer()
        this.setState({keypad: {active: false}})

        window.setTimeout(() => {
            delete this.app.state.calls.calls[this.id]
            delete this.app.modules.calls.calls[this.id]
            // This call is being cleaned up; move to a different call
            // when this call was the active call.
            if (this.state.active) this.module.setActiveCall(null, false)
            this.app.emit('fg:set_state', {action: 'delete', path: `calls/calls/${this.id}`})
        }, timeout)
    }


    generateUUID() {
        var d = new Date().getTime()
        var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            var r = (d + Math.random() * 16) % 16 | 0
            d = Math.floor(d / 16)
            return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16)
        })
        return uuid
    }


    /**
    * Keep the state local to this class, unless the
    * call's id is known. Then we can keep track
    * of the call from Vue.
    * @param {Object} state - The state to update.
    */
    setState(state) {
        // This merges to the call's local state; not the app's state!
        this.app.__mergeDeep(this.state, state)
        // Allows calls to come in without troubling the UI.
        if (this.silent) return

        this.app.emit('fg:set_state', {action: 'merge', path: `calls/calls/${this.id}`, state: state})
    }


    startTimer() {
        this.setState({timer: {current: new Date().getTime(), start: new Date().getTime()}})
        this.timerId = window.setInterval(() => {
            this.setState({timer: {current: new Date().getTime()}})
        }, 1000)
    }


    stopTimer() {
        clearInterval(this.timerId)
    }

}


module.exports = Call
