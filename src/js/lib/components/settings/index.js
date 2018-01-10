module.exports = (app) => {
    return {
        methods: {
            login: function() {
                app.emit('user:login.attempt', {
                    password: this.user.password,
                    username: this.user.email,
                })
            },
            save: function(e) {
                app.emit('bg:set_state', {
                    persist: true,
                    state: {
                        settings: this.settings,
                    },
                })
            },
        },
        render: templates.settings.r,
        staticRenderFns: templates.settings.s,
        store: {
            settings: 'settings',
            user: 'user',
        },
    }
}
