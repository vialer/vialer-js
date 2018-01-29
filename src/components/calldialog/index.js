module.exports = (app) => {

    return {
        computed: app.utils.sharedComputed(),
        data: function() {
            return {
                dtmfnumbers: '', // Reference to the number while a call is underway.
                intervalId: 0,
                keypad: false,
                number: null,
                startDate: new Date().getTime(),
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
                app.emit('bg:sip:call_terminate', {callId: call.id})
            },
            classes: function(block) {
                let classes = {}
                if (block === 'component') {
                    if (block === 'component') {
                        if (this.call.status) classes['call-active'] = true
                        else classes['no-call'] = true
                    }
                }
                return classes
            },
            dial: function(number) {
                if (!number) return
                app.emit('bg:sip:call', {number: number})
            },
            toggleHold: function() {
                app.emit('bg:sip:toggle_hold', {callId: this.call.id})
            },
            toggleKeypad: function() {
                this.keypad = !this.keypad
            },
            toggleTransfer: function() {
                // Toggle hold and set the UI in transfer mode.
                console.log('TRANSFER:', this.call)
                app.emit('bg:sip:toggle_transfer', {callId: this.call.id})
                app.setState({sip: {session: {transfer: true}}})
            },
        },
        props: ['call'],
        render: templates.calldialog.r,
        staticRenderFns: templates.calldialog.s,
        store: {
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
