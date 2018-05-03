module.exports = (app) => {

    const v = Vuelidate.validators

    /**
    * @memberof fg.components
    */
    const Login = {
        computed: app.helpers.sharedComputed(),
        data: function() {
            return {
                password: '',
                twoFactorToken: {message: '', valid: true, value: null},
                validateApi: false,
            }
        },
        methods: Object.assign({
            login: function() {
                if (this.$v.$invalid) return
                if (this.app.session.active === 'new' || !this.app.session.available.length) {
                    if (!this.user.twoFactor) {
                        app.emit('bg:user:login', {
                            password: this.password,
                            username: this.user.username,
                        })
                    } else {
                        app.emit('bg:user:login', {
                            callback: ({valid, message}) => {
                                this.twoFactorToken.valid = valid
                                this.validateApi = true
                                this.twoFactorToken.message = message
                            },
                            password: this.password,
                            token: this.twoFactorToken.value,
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
            selectSession: function(session) {
                app.emit('bg:user:set_session', {session})
            },
        }, app.helpers.sharedMethods()),
        render: templates.login.r,
        staticRenderFns: templates.login.s,
        store: {
            app: 'app',
            url: 'settings.platform.url',
            user: 'user',
            vendor: 'app.vendor',
        },
        validations: function() {
            // Bind the API response message to the validator $params.
            const apiResponse = Vuelidate.withParams({
                message: this.twoFactorToken.message,
                type: 'apiResponse',
            }, () => {
                return this.twoFactorToken.valid
            })

            let validations = {
                password: {
                    minLength: v.minLength(6),
                    required: v.required,
                },
                twoFactorToken: {
                    value: {
                        apiResponse,
                        numeric: v.numeric,
                        requiredIf: v.requiredIf(() => {
                            return this.user.twoFactor
                        }),
                    },
                },
                user: {
                    username: {
                        email: v.email,
                        requiredIf: v.requiredIf(() => {
                            return !this.app.session.active
                        }),
                    },
                },
            }

            return validations
        },
        watch: {
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
