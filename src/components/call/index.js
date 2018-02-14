module.exports = (app) => {

    return {
        computed: Object.assign({
            // If the current call is in transfer mode.
            transferActive: function() {
                return this.call.transfer.active
            },
        }, app.utils.sharedComputed()),
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
                if (block === 'component') {
                    if (this.callOngoing) {
                        classes['call-ongoing'] = true
                    }
                } else if (block === 'dialpad-button') {
                    classes.active = this.call.keypad.active && this.call.keypad.mode === 'dtmf'
                    classes.disabled = this.call.keypad.disabled || this.transferActive
                } else if (block === 'attended-button') {
                    classes.active = (this.call.transfer.type === 'attended')
                } else if (block === 'blind-button') {
                    classes.active = (this.call.transfer.type === 'blind')
                    classes.disabled = (this.transferStatus !== 'select')
                } else if (block === 'hold-button') {
                    classes.active = this.call.hold.active
                    classes.disabled = this.call.hold.disabled
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
                if (this.call.keypad.disabled || this.transferActive) return
                const keypadOn = (!this.call.keypad.active || this.call.keypad.mode !== 'dtmf')
                app.setState(
                    {keypad: {active: keypadOn, display: 'touch', mode: 'dtmf'}},
                    {path: `calls/calls/${this.call.id}`})
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
}
