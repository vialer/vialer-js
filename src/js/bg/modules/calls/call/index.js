/**
* Common Call class for Click-to-dial and WebRTC calling.
*/
class Call {

    constructor(module, target, {active, silent} = {}) {
        this.module = module
        this.app = this.module.app
        this.ua = this.module.ua
        this.silent = silent

        this._started = false

        this.busyTone = new this.app.sounds.BusyTone()
        this.translations = this.app.helpers.getTranslations().call
        this.ringtone = new this.app.sounds.RingTone(this.app.state.settings.ringtones.selected.name)
        this.ringbackTone = new this.app.sounds.RingbackTone()

        this.id = this.generateUUID()

        this.state = {
            active: false,
            class: this.constructor.name,
            displayName: null,
            hangup: {
                disabled: false,
            },
            hold: {
                active: false,
                disabled: false,
            },
            id: this.id,
            keypad: {
                active: false,
                disabled: false,
                display: 'touch', // 'dense' or 'touch'
                mode: 'dtmf', // 'call' or 'dtmf'
                number: null,
            },
            number: null,
            status: null,
            timer: {
                current: null,
                start: null,
            },
            transfer: {
                active: false,
                disabled: false,
                type: 'attended',
            },
            type: null, // incoming or outgoing
        }

        // The default Call status codes, which each Call implementation
        // should map to.
        this._statusMap = {
            accepted: 'accepted',
            bye: 'bye',
            create: 'create',
            invite: 'invite',
            rejected_a: 'rejected_a',
            rejected_b: 'rejected_b',
        }

        // Sync the store's reactive properties to the foreground.
        if (!this.silent) {
            Vue.set(this.app.state.calls.calls, this.id, this.state)
            this.app.emit('fg:set_state', {action: 'insert', path: `calls/calls/${this.id}`, state: this.state})
        }
    }


    /**
    * Generic UI and state-related logic for an outgoing call.
    * Note: first set the number and displayName in the parent,
    * before calling this super.
    */
    _incoming() {
        this.setState(this.state)

        // Signal the user about the incoming call.
        if (!this.silent) {
            this.app.setState({ui: {layer: 'calls', menubar: {event: 'ringing'}}})

            this.app.modules.ui.notification({
                message: `${this.state.number}: ${this.state.displayName}`,
                number: this.state.number,
                title: this.translations.invite,
            })

            this.ringtone.play()
            this.module.activateCall(this, true)
        }
    }


    /**
    * Generic UI and state-related logic for an outgoing call.
    */
    _outgoing() {
        // Try to fill in the displayName from contacts.
        const contacts = this.app.state.contacts.contacts
        let displayName = ''
        for (const id of Object.keys(contacts)) {
            if (contacts[id].number === parseInt(this.number)) {
                displayName = contacts[id].name
            }
        }

        if (!this.silent) {
            // Always set this call to be the active call as soon a new
            // connection has been made.
            this.module.activateCall(this, true)
            let message = ''
            if (displayName) message = `${this.state.number}: ${displayName}`
            else message = this.state.number
            this.app.modules.ui.notification({message, number: this.state.number, title: this.translations.create})
        }

        this.setState({displayName: displayName, status: this._statusMap.create})
        this.app.setState({ui: {layer: 'calls', menubar: {event: 'ringing'}}})
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
            this.app.emit('fg:notify', {icon: 'warning', message: this.app.$t('Failed to set input or output device.'), type: 'danger'})
        }

        return navigator.mediaDevices.getUserMedia({audio: true})
    }


    /**
    * Handle logic when a call is started; both incoming and outgoing.
    * @param {Object} opts - Options to pass to _start.
    * @param {Number} opts.timeout - Postpones resetting the call state.
    * @param {Boolean} opts.force - Force showing a notification.
    * @param {String} [opts.message] - Force a notification message.
    */
    _start({force = false, message = ''}) {
        if (!message) {
            message = this.state.number
            if (this.state.displayName) message += `:${this.state.displayName}`
        }
        this._started = true
        this.ringbackTone.stop()
        this.ringtone.stop()
        this.setState({status: 'accepted', timer: {current: new Date().getTime(), start: new Date().getTime()}})

        if (!this.silent) {
            this.app.modules.ui.notification({force, message, number: this.state.number, title: this.translations.accepted[this.state.type]})
        }

        this.app.setState({ui: {menubar: {event: 'calling'}}})
        this.timerId = window.setInterval(() => {
            this.setState({timer: {current: new Date().getTime()}})
        }, 1000)
    }


    /**
    * Takes care of returning to a state before the call
    * was created. Make sure you set the final state of a call
    * before calling cleanup. The timeout is meant to postpone
    * resetting the state, so the user has a hint of what
    * happened in between.
    * @param {Object} opts - Options to pass to _stop.
    * @param {Boolean} opts.force - Force showing a notification.
    * @param {String} [opts.message] - Force a notification message.
    * @param {Number} opts.timeout - Postpones resetting the call state.
    */
    _stop({force = false, message = '', timeout = 3000}) {
        if (!message) {
            message = this.state.number
            if (this.state.displayName) message += `:${this.state.displayName}`
        }
        // Stop all call state sounds that may still be playing.
        this.ringbackTone.stop()
        this.ringtone.stop()

        if (force || !this.silent) {
            if (this.state.status === 'rejected_b') {
                this.app.modules.ui.notification({force, message, number: this.state.number, stack: true, title: this.translations.rejected_b})
            } else {
                this.app.modules.ui.notification({force, message, number: this.state.number, stack: true, title: this.translations.bye})
            }
        }

        this.stopTimer()
        this.app.setState({ui: {menubar: {event: null}}})
        this.setState({keypad: {active: false}})

        // Reset the transfer state of target calls in case the transfer mode
        // of this Call is active and the callee ends the call.
        if (this.state.transfer.active) this.module.__setTransferState(this, false)

        window.setTimeout(() => {
            this.busyTone.stop()
            this.module.deleteCall(this)
            // Signal browser tabs to remove the click-to-dial notification label.
            this.app.modules.ui.notification({number: this.state.number})
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


    toString() {
        return `${this.app}[call] [${this.id}] `
    }

}


module.exports = Call
