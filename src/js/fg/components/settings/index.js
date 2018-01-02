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
        render: templates.settings.r,
        staticRenderFns: templates.settings.s,
        store: {
            user: 'user',
        },
    }
}
