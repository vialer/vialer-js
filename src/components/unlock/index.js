module.exports = (app) => {

    const v = Vuelidate.validators

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
            unlock: function() {
                app.emit('bg:user:unlock', {
                    password: this.user.password,
                })
            },
        }, app.helpers.sharedMethods()),
        render: templates.unlock.r,
        staticRenderFns: templates.unlock.s,
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
                },
            }

            return validations
        },
    }
}
