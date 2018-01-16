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
                now: Math.trunc((new Date()).getTime() / 1000),
                timerStarted: false,
            }
        },
        destroyed: function() {
            clearInterval(this.interval)
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
                this.timerStarted = true
                this.date = Math.trunc((new Date()).getTime() / 1000)
                this.now = this.date
                this.interval = window.setInterval(() => {
                    this.now = Math.trunc((new Date()).getTime() / 1000)
                }, 1000)
            },
            stopSession: function() {
                clearInterval(this.interval)
                app.emit('sip:stop_session')
            },
            toggleHold: function() {
                this.hold = !this.hold
                app.emit('sip:toggle_hold')
            },
        },
        mounted: function() {
            this.timerStarted = false
            this.date = Math.trunc((new Date()).getTime() / 1000)
            this.now = this.date
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
                } else if (newVal === 'bye') {
                    clearInterval(this.interval)
                }
            },
        },
    }
}
