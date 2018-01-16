module.exports = (app, actions) => {

    Vue.filter('two_digits', function(value) {
        if (value.toString().length <= 1) {
            return `0${value.toString()}`
        }
        return value.toString()
    });

    return {
        computed: {
            days: function() {
                return Math.trunc((this.now - this.date) / 60 / 60 / 24)
            },
            hours: function() {
                return Math.trunc((this.now - this.date) / 60 / 60) % 24
            },
            minutes: function() {
                return Math.trunc((this.now - this.date) / 60) % 60
            },
            seconds: function() {
                return (this.now - this.date) % 60
            },
        },
        data: function() {
            return {
                date: Math.trunc((new Date()).getTime() / 1000),
                intervalId: 0,
                now: Math.trunc((new Date()).getTime() / 1000),
                timer: false,
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
            startTimer: function() {
                this.date = Math.trunc((new Date()).getTime() / 1000)
                this.now = this.date

                this.intervalId = window.setInterval(() => {
                    this.now = Math.trunc((new Date()).getTime() / 1000)
                }, 1000)
                this.timer = true
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
        },
        props: {
            keypad: {
                default: false,
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
                if (newVal === 'accepted') {
                    this.startTimer()
                } else if (['bye', 'rejected'].includes(newVal)) {
                    // Stop timer on hangup.
                    clearInterval(this.intervalId)
                } else if (!newVal) {
                    // Hide timer when the callstate is reset.
                    this.timer = false
                }
            },
        },
    }
}
