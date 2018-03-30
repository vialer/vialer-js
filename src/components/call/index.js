module.exports = (app) => {
    /**
    * @memberof fg.components
    */
    const Call = {
        computed: Object.assign({
            // If the current call is in transfer mode.
            callCanTerminate: function() {
                if (this.call.hangup.disabled) return false
                if (this.call.transfer.active) return false
                if (!['accepted', 'create', 'invite'].includes(this.call.status)) return false
                if (this.call.keypad.active) return false
                return true
            },
        }, app.helpers.sharedComputed()),
        data: function() {
            return {
                intervalId: 0,
                keypad: false,
            }
        },
        destroyed: function() {
            clearInterval(this.intervalId)
        },
        methods: {
            callAccept: function(call) {
                app.emit('bg:calls:call_accept', {callId: call.id})
            },
            callTerminate: function(call) {
                app.emit('bg:calls:call_terminate', {callId: call.id})
            },
            classes: function(block) {
                let classes = {}

                if (block === 'attended-button') {
                    classes.active = (this.call.transfer.type === 'attended')
                } else if (block === 'component') {
                    if (this.callOngoing) {
                        classes['call-ongoing'] = true
                    }
                } else if (block === 'dialpad-button') {
                    classes.active = this.call.keypad.active && this.call.keypad.mode === 'dtmf'
                    classes.disabled = this.call.keypad.disabled || this.call.transfer.active
                } else if (block === 'blind-button') {
                    classes.active = (this.call.transfer.type === 'blind')
                    classes.disabled = (this.transferStatus !== 'select')
                } else if (block === 'hold-button') {
                    classes.active = this.call.hold.active
                    classes.disabled = this.call.hold.disabled
                } else if (block === 'mute-button') {
                    classes.active = this.call.mute.active
                } else if (block === 'transfer-button') {
                    classes.active = this.call.transfer.active
                    classes.disabled = this.call.transfer.disabled
                }
                return classes
            },
            holdToggle: function() {
                if (this.call.hold.disabled) return
                app.emit('bg:calls:hold_toggle', {callId: this.call.id})
            },
            keypadToggle: function() {
                // Keypad cannot be active during transfer.
                if (this.call.keypad.disabled || this.call.transfer.active) return
                const keypadOn = (!this.call.keypad.active || this.call.keypad.mode !== 'dtmf')
                app.setState(
                    {keypad: {active: keypadOn, display: 'touch', mode: 'dtmf'}},
                    {path: `calls/calls/${this.call.id}`}
                )
            },
            muteToggle: function() {
                app.emit('bg:calls:mute_toggle', {callId: this.call.id})
            },
            transferFinalize: function() {
                app.emit('bg:calls:transfer_finalize', {callId: this.call.id})
            },
            transferMode: function(type) {
                if (this.transferStatus !== 'select') return
                app.setState({transfer: {type}}, {path: `calls/calls/${this.call.id}`})
            },
            transferToggle: function() {
                if (this.call.transfer.disabled) return
                app.emit('bg:calls:transfer_toggle', {callId: this.call.id})
            },
        },
        props: {
            call: {default: null},
        },
        render: templates.call.r,
        staticRenderFns: templates.call.s,
        store: {
            calls: 'calls.calls',
        },
    }

    return Call
}
