module.exports = (app, shared) => {
    /**
    * @memberof fg.components
    */
    const WizardAccount = {
        computed: Object.assign({
            stepValid: function() {
                const selectedAccountId = this.settings.webrtc.account.selected.id
                const accountsLoading = this.settings.webrtc.account.status === 'loading'
                if (this.validAccountSettings && selectedAccountId && !accountsLoading) {
                    return true
                }
                return false
            },
        }, app.helpers.sharedComputed()),
        methods: Object.assign({
            chooseAccount: function() {
                const selected = this.account.selected
                app.setState({settings: {webrtc: {account: {selected}, toggle: true}}}, {persist: true})
                this.stepNext()
            },
        }, shared().methods),
        mounted: function() {
            // Reset validation, so it may not be triggered when
            // the platform service retrieves account choices.
            this.$v.$reset()
            app.state.settings.webrtc.toggle = true
        },
        render: templates.wizard_account.r,
        staticRenderFns: templates.wizard_account.s,
        store: {
            account: 'settings.webrtc.account',
            app: 'app',
            options: 'settings.wizard.steps.options',
            selected: 'settings.wizard.steps.selected',
            settings: 'settings',
        },
        validations: function() {
            let validations = {
                settings: {
                    webrtc: {
                        account: app.helpers.sharedValidations.bind(this)().settings.webrtc.account,
                    },
                },
            }

            return validations
        },
    }

    return WizardAccount
}
