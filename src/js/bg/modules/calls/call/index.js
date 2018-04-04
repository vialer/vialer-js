/**
* @module ModuleCalls
*/

/**
* Base Call class that each implementation of a Call must use.
* Currently used by CallConnectAB and CallSIP.
*/
class Call {
    /**
    * Initialize a new Call object by setting up some Call sounds
    * and set initial state. This state is shared by the UI of
    * AppForeground and the backend of AppBackground.
    * @param {AppBackground} app - The background application.
    * @param {String} target - A target endpoint to call. Typically a number.
    * @param {Object} options - Call options to pass.
    * @param {Boolean} options.active - Whether this Call should be activated in the UI.
    * @param {Boolean} options.silent - Whether to setup a Call without disturbing the UI.
    */
    constructor(app, target, {active, silent} = {}) {
        this.app = app
        this.module = app.modules.calls

        this.ua = this.module.ua
        this.silent = silent

        this._started = false

        this.busyTone = new this.app.sounds.BusyTone()
        this.translations = this.app.helpers.getTranslations().call
        this.ringtone = new this.app.sounds.RingTone(this.app.state.settings.ringtones.selected.name)
        this.ringbackTone = new this.app.sounds.RingbackTone()

        this.id = shortid.generate()
        /**
        * @property {Object} state - Reactive computed properties from Vue-stash.
        * @property {Boolean} state.active - Whether the Call shows in the UI or not.
        * @property {String} state.class - Used to identify the Call type with.
        * @property {String} state.displayName - The name to show when calling.
        * @property {Object} state.hangup - Specifies the hangup feature of a Call.
        * @property {Object} state.hold - Specifies the hold feature of a Call.
        * @property {String} state.id - The generated UUID of the Call.
        * @property {Object} state.keypad - Whether the type of Call supports a keypad feature.
        * @property {String} state.number - The Call's endpoint identifier.
        * @property {String} state.status - A Call state identifier as described in `this._statusMap`.
        * @property {Object} state.timer - Keeps track of the Call time.
        * @property {Object} state.transfer - Specifies the transfer feature of a Call.
        * @property {String} state.type - Either `incoming` or `outgoing`.
        */
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
            mute: {
                active: false,
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
    * Add two video elements to the DOM of AppBackground and ask for
    * permission to the microphone. In a WebExtension, addding the video
    * elements to the background script DOM allows us to keep the Call
    * stream active after the popup is closed.
    * @returns {Promise} - Resolves with the local audio stream.
    */
    async _initMedia() {
        // Append the AV-elements in the background DOM, so the audio
        // can continue to play when the popup closes.
        if (document.querySelector('.remote')) {
            // Reuse existing media elements.
            this.remoteVideo = document.querySelector('.remote')
        } else {
            this.remoteVideo = document.createElement('video')
            this.remoteVideo.classList.add('remote')
            document.body.prepend(this.remoteVideo)
        }

        // Set the output device from settings.
        const sinks = this.app.state.settings.webrtc.sinks
        try {
            if (sinks.input.id) this.remoteVideo.setSinkId(sinks.input.id)
            if (sinks.output.id) await this.remoteVideo.setSinkId(sinks.output.id)
        } catch (err) {
            const message = this.app.$t('Failed to set input or output device.')
            this.app.emit('fg:notify', {icon: 'warning', message, type: 'danger'})
        }

        return navigator.mediaDevices.getUserMedia(this.app._getUserMediaFlags())
    }


    /**
    * Some UI state plumbing to setup an outgoing Call.
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


    /**
    * Handle logic when a call is started; both incoming and outgoing.
    * @param {Object} options - Options to pass to _start.
    * @param {Number} options.timeout - Postpones resetting the call state.
    * @param {Boolean} options.force - Force showing a notification.
    * @param {String} [options.message] - Force a notification message.
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
            const title = this.translations.accepted[this.state.type]
            this.app.modules.ui.notification({force, message, number: this.state.number, title})
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
    * @param {Object} options - Options to pass to _stop.
    * @param {Boolean} options.force - Force showing a notification.
    * @param {String} [options.message] - Force a notification message.
    * @param {Number} options.timeout - Postpones resetting the call state.
    */
    _stop({force = false, message = '', timeout = 3000} = {}) {
        if (!message) {
            message = this.state.number
            if (this.state.displayName) message += `:${this.state.displayName}`
        }
        // Stop all call state sounds that may still be playing.
        this.ringbackTone.stop()
        this.ringtone.stop()

        if (force || !this.silent) {
            if (this.state.status === 'rejected_b') {
                const title = this.translations.rejected_b
                this.app.modules.ui.notification({force, message, number: this.state.number, stack: true, title})
            } else {
                const title = this.translations.bye
                this.app.modules.ui.notification({force, message, number: this.state.number, stack: true, title})
            }
        }

        // An ongoing call is closed. Signal listeners like activity
        // about it.
        if (this.state.status === 'bye') {
            this.app.emit('bg:calls:call_ended', {call: this.state}, true)
        }


        // Stop the Call interval timer.
        clearInterval(this.timerId)
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
        this.remoteStream = new MediaStream()
    }


    /**
    * Convenient version of setState that keeps the state local
    * to  a Call instance.
    * @param {Object} state - The state to update.
    */
    setState(state) {
        // This merges to the call's local state; not the app's state!
        this.app.__mergeDeep(this.state, state)
        // Allows calls to come in without troubling the UI.
        if (this.silent) return

        this.app.emit('fg:set_state', {action: 'upsert', path: `calls.calls.${this.id}`, state})
    }


    /**
    * Generate a representational name for this module. Used for logging.
    * @returns {String} - An identifier for this module.
    */
    toString() {
        return `${this.app}[call] [${this.id}] `
    }

}


module.exports = Call
