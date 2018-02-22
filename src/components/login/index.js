module.exports = (app) => {
    return {
        computed: {
            greeting: function() {
                let hours = new Date().getHours()
                if (hours < 12) return this.$t('Good Morning')
                else if (hours >= 12 && hours <= 17) return this.$t('Good Afternoon')
                else return this.$t('Good Evening')
            },
        },
        methods: Object.assign({
            login: function() {
                app.emit('bg:user:login', {
                    password: this.user.password,
                    username: this.user.username,
                })
            },
        }, app.helpers.sharedMethods()),
        render: templates.login.r,
        staticRenderFns: templates.login.s,
        store: {
            app: 'app',
            user: 'user',
            vendor: 'app.vendor',
        },
        watch: {
            'user.username': function(newVal, oldVal) {
                app.setState({user: {username: newVal}}, {persist: true})
            },
        },
    }
}
