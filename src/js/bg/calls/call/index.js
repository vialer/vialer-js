/**
* Common Call class for Click-to-dial and WebRTC calling.
*/
class Call {

    constructor(module, callTarget, {active, silent} = {}) {
        this.module = module
        this.app = this.module.app
        this.ua = this.module.ua
        this.silent = silent

        this.busyTone = new this.app.sounds.BusyTone()
        this.ringtone = new this.app.sounds.RingTone(this.app.state.settings.ringtones.selected.name)
        this.ringbackTone = new this.app.sounds.RingbackTone()

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

        // Sync the store's reactive properties.
        if (!this.silent) {
            Vue.set(this.app.state.calls.calls, this.id, this.state)
            this.app.emit('fg:set_state', {action: 'insert', path: `calls/calls/${this.id}`, state: this.state})
        }
    }


    async _initMedia() {
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
    * Handle logic when a call is started; both incoming and outgoing.
    */
    _start() {
        this.ringbackTone.stop()
        this.ringtone.stop()
        this.setState({status: 'accepted', timer: {current: new Date().getTime(), start: new Date().getTime()}})
        this.app.setState({ui: {menubar: {event: 'calling'}}})
        this.timerId = window.setInterval(() => {
            this.setState({timer: {current: new Date().getTime()}})
        }, 1000)
    }


    /**
    * Takes care of returning to a state before the call
    * was made. Make sure you set the final state of a call
    * before calling cleanup. The timeout is meant to postpone
    * resetting the state, in order to give the user a hint of
    * what happened in between.
    * @param {Number} timeout - Postpones resetting the call state.
    */
    _stop(timeout = 3000) {
        // Stop all sounds.
        this.ringbackTone.stop()
        this.ringtone.stop()

        this.stopTimer()
        this.app.setState({ui: {menubar: {event: null}}})
        this.setState({keypad: {active: false}})

        window.setTimeout(() => {
            this.busyTone.stop()
            this.module.deleteCall(this)
        }, timeout)
    }


    accept() {
        if (!(this.state.type === 'incoming')) throw 'session must be incoming type'
        this.localVideo.srcObject = this.stream
        this.localVideo.play()
        this.localVideo.muted = true

        this.remoteStream = new MediaStream()
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


    stopTimer() {
        clearInterval(this.timerId)
    }

}


module.exports = Call
