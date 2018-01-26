module.exports = (app) => {

    return {
        computed: app.utils.sharedComputed(),
        data: function() {
            return {
                dtmfnumbers: '', // Reference to the number while a call is underway.
                intervalId: 0,
                keypad: false,
                startDate: new Date().getTime(),
            }
        },
        destroyed: function() {
            clearInterval(this.intervalId)
        },
        methods: {
            acceptSession: function() {
                app.emit('bg:sip:accept_session')
            },
            dial: function(number) {
                if (!number) return
                app.emit('bg:sip:call', {number: number})
            },
            stopSession: function() {
                app.emit('bg:sip:stop_session')
            },
            toggleHold: function() {
                app.emit('bg:sip:toggle_hold')
            },
            toggleKeypad: function() {
                this.keypad = !this.keypad
            },
            toggleTransfer: function() {
                // Toggle hold and set the UI in transfer mode.
                app.emit('bg:sip:toggle_hold')
                app.setState({sip: {session: {transfer: true}}})
            },
        },
        render: templates.calldialog.r,
        staticRenderFns: templates.calldialog.s,
        store: {
            module: 'calldialog',
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
