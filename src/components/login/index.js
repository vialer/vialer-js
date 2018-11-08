module.exports = (app) => {

    const v = Vuelidate.validators

    /**
    * @memberof fg.components
    */
    const Login = {
        computed: app.helpers.sharedComputed(),
        created: function() {
            // Restore password from state to local data if set.
            if (this.user.password) {
                this.password = this.user.password
            }
        },
        data: function() {
            return {
                password: '',
                twoFactorToken: {message: '', valid: true, value: null},
            }
        },
        methods: Object.assign({
            login: function() {
                if (this.$v.$invalid) return

                if (this.app.session.active === 'new' || !this.app.session.available.length) {
                    if (this.user.twoFactor) {
                        // Two-factor login flow.
                        app.emit('bg:user:login', {
                            callback: ({valid, message}) => {
                                if (valid) {
                                    // Remove the password from the state.
                                    app.setState({user: {password: null}})
                                } else {
                                    console.log('setting not valid 2fa: ', message)
                                    this.twoFactorToken.valid = valid
                                    this.twoFactorToken.message = message.capitalize()
                                    this.$v.$reset()
                                }
                            },
                            password: this.password,
                            token: this.twoFactorToken.value,
                            username: this.user.username,
                        })
                    } else {
                        app.emit('bg:user:login', {
                            callback: ({twoFactor}) => {
                                if (twoFactor) {
                                    // Save password in the (bg-)state, so that if the user
                                    // we still have the password for the next login.
                                    app.setState({user: {password: this.password}})
                                }
                            },
                            endpoint: this.settings.webrtc.endpoint.uri,
                            password: this.password,
                            username: this.user.username,
                        })
                    }
                } else {
                    app.emit('bg:user:unlock', {
                        password: this.password,
                        username: this.app.session.active,
                    })
                }
            },
            newSession: function() {
                app.setState({app: {session: {active: 'new'}}, user: {username: ''}})
            },
            removeSession: function(session) {
                app.emit('bg:user:remove_session', {session})
            },
            selectSession: function(session = null) {
                this.password = ''
                app.emit('bg:user:set_session', {session})
            },
        }, app.helpers.sharedMethods()),
        render: templates.login.r,
        staticRenderFns: templates.login.s,
        store: {
            account: 'settings.webrtc.account',
            app: 'app',
            availability: 'availability',
            calls: 'calls',
            settings: 'settings',
            url: 'settings.platform.url',
            user: 'user',
            vendor: 'app.vendor',
        },
        updated: function() {
            // Validation needs to be reset after an update, so
            // the initial validation is only done after a user
            // action.
            this.$v.$reset()
        },
        validations: function() {
            // Bind the API response message to the validator $params.
            let validations = {
                password: {
                    minLength: v.minLength(6),
                    required: v.required,
                },
                twoFactorToken: {
                    value: {
                        customValid: Vuelidate.withParams({
                            message: this.twoFactorToken.message,
                            type: 'customValid',
                        }, () => {
                            return this.twoFactorToken.valid
                        }),
                        numeric: v.numeric,
                        requiredIf: v.requiredIf(() => {
                            return this.user.twoFactor
                        }),
                    },
                },
                user: {
                    username: {
                        requiredIf: v.requiredIf(() => {
                            return !this.app.session.active
                        }),
                    },
                },
            }

            return validations
        },
        watch: {
            'settings.webrtc.endpoint.uri': function(uri) {
                app.setState({settings: {webrtc: {endpoint: {uri}}}})
            },
            'twoFactorToken.value': function() {
                this.twoFactorToken.valid = true
            },
            'user.username': function(username) {
                app.setState({user: {username}})
            },
        },
    }


    return Login
}
