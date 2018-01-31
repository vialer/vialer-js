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
                app.emit('bg:sip:call_answer', {callId: call.id})
            },
            callTerminate: function(call) {
                if (this.transferActive) return
                app.emit('bg:sip:call_terminate', {callId: call.id})
            },
            classes: function(block) {
                let classes = {}
                if (block === 'component') {
                    if (this.call.status) classes['call-active'] = true
                    if (this.call.keypad.active) classes['with-keypad'] = true
                    else classes['no-call'] = true
                }
                return classes
            },
            dial: function(number) {
                if (!number) return
                app.emit('bg:sip:call', {number: number})
            },
            holdToggle: function() {
                app.emit('bg:sip:hold_toggle', {callId: this.call.id})
            },
            keypadToggle: function() {
                if (this.transferActive) return
                app.setState({keypad: {active: !this.call.keypad.active}}, {path: `sip/calls/${this.call.id}`})
            },
            transferFinalize: function() {
                app.emit('bg:sip:transfer_finalize', {callId: this.call.id})
            },
            transferMode: function(type) {
                if (this.transferStatus !== 'select') return
                app.setState({transfer: {type}}, {path: `sip/calls/${this.call.id}`})
            },
            transferToggle: function() {
                app.emit('bg:sip:transfer_toggle', {callId: this.call.id})
            },
        },
        props: {
            call: {default: null},
        },
        render: templates.calldialog.r,
        staticRenderFns: templates.calldialog.s,
        store: {
            calls: 'sip.calls',
            sip: 'sip',
        },
        watch: {
            'sip.session.state': function(newVal, oldVal) {
                // Remote party hangs up. Stop the timer.
                if (['bye', 'rejected'].includes(newVal)) {
                    // Stop timer on hangup.
                    if (this.keypad) {
                        this.keypad = false
                    }
                }
            },
        },
    }
}
