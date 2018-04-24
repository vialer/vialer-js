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
            }
        },
        methods: Object.assign({
            login: function() {
                if (this.$v.$invalid) return
                app.emit('bg:user:login', {
                    password: this.password,
                    username: this.user.username,
                })
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
            let validations = {
                password: {
                    minLength: v.minLength(6),
                    required: v.required,
                },
                user: {
                    username: {
                        email: v.email,
                        required: v.required,
                    },
                },
            }

            return validations
        },
        watch: {
            'user.username': function(newVal, oldVal) {
                app.setState({user: {username: newVal}}, {persist: false})
            },
        },
    }


    return Login
}
