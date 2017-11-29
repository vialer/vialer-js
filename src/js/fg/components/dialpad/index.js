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
        render: templates.options.r,
        staticRenderFns: templates.options.s,
        store: {
            user: 'user',
        },
    }
}
