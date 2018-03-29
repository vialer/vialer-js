module.exports = (app) => {

    const v = Vuelidate.validators

    /**
    * @memberof fg.components
    */
    const Login = {
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
            url: 'settings.platform.url',
            user: 'user',
            vendor: 'app.vendor',
        },
        validations: function() {
            let validations = {
                user: {
                    password: {
                        minLength: v.minLength(6),
                        required: v.required,
                    },
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
