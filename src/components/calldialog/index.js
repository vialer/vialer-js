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
            callAnswer: function(call) {
                app.emit('bg:calls:call_answer', {callId: call.id})
            },
            callTerminate: function(call) {
                if (this.transferActive) return
                app.emit('bg:calls:call_terminate', {callId: call.id})
            },
            classes: function(block) {
                let classes = {}
                if (block === 'component') {
                    if (!this.callsActive) {
                        classes.inactive = true
                    }
                } else if (block === 'dialpad-button') {
                    classes.active = this.call.keypad.active && this.call.keypad.mode === 'dtmf'
                    classes.disabled = this.transferActive
                } else if (block === 'attended-button') {
                    classes.active = (this.call.transfer.type === 'attended')
                } else if (block === 'blind-button') {
                    classes.active = (this.call.transfer.type === 'blind')
                    classes.disabled = (this.transferStatus !== 'select')
                }

                return classes
            },
            dial: function(number) {
                if (!number) return
                app.emit('bg:calls:call', {number: number})
            },
            holdToggle: function() {
                app.emit('bg:calls:hold_toggle', {callId: this.call.id})
            },
            keypadToggle: function() {
                // Keypad cannot be active during transfer.
                if (this.transferActive) return
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
                app.emit('bg:calls:transfer_toggle', {callId: this.call.id})
            },
        },
        props: {
            call: {default: null},
        },
        render: templates.calldialog.r,
        staticRenderFns: templates.calldialog.s,
        store: {
            calls: 'calls.calls',
        },
    }
}
