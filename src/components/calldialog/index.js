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
            }
        },
        destroyed: function() {
            clearInterval(this.interval)
        },
        methods: {
            acceptSession: function() {

            },
            declineSession: function() {

            },
        },
        mounted: function() {
            this.date = Math.trunc((new Date()).getTime() / 1000)
            this.interval = window.setInterval(() => {
                this.now = Math.trunc((new Date()).getTime() / 1000)
            }, 1000)
        },
        render: templates.calldialog.r,
        staticRenderFns: templates.calldialog.s,
        store: {
            module: 'calldialog',
        },
    }
}
