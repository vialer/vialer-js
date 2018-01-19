module.exports = (app, utils) => {

    return {
        computed: utils.sharedComputed(),
        data: function() {
            return {
                dtmfnumbers: '', // Reference to the number while a call is underway.
                intervalId: 0,
                keypad: false,
                startDate: new Date().getTime(),
                transfer: false,
            }
        },
        destroyed: function() {
            clearInterval(this.intervalId)
        },
        methods: {
            acceptSession: function() {
                app.emit('sip:accept_session')
            },
            dial: function(number) {
                app.emit('dialer:dial', {
                    analytics: 'Dialpad',
                    b_number: number,
                    forceSilent: false,
                })
            },
            stopSession: function() {
                app.emit('sip:stop_session')
            },
            toggleHold: function() {
                this.hold = !this.hold
                app.emit('sip:toggle_hold')
            },
            toggleKeypad: function() {
                this.keypad = !this.keypad
            },
            transferButton: function() {
                // Show hide the transfer window.
                this.transfer = !this.transfer
                // app.emit('sip:start_transfer')
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
