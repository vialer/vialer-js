module.exports = (app) => {
    return {
        methods: {
            login: function() {
                app.emit('bg:user:login', {
                    password: this.user.password,
                    username: this.user.username,
                })
            },
        },
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
