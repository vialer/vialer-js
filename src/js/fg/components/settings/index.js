module.exports = (app) => {
    return {
        methods: {
            login: function() {
                app.emit('user:login.attempt', {
                    password: this.user.password,
                    username: this.user.email,
                })
            },
        },
        render: templates.login.r,
        staticRenderFns: templates.login.s,
        store: {
            user: 'user',
        },
    }
}
