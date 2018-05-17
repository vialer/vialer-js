module.exports = (app) => {
    /**
    * @memberof fg.components
    */
    const WizardStepVoipaccount = {
        computed: app.helpers.sharedComputed(),
        mounted: function() {
            app.setState({settings: {webrtc: {enabled: true}}}, {persist: true})
        },
        render: templates.wizard_step_voipaccount.r,
        staticRenderFns: templates.wizard_step_voipaccount.s,
        store: {
            app: 'app',
            settings: 'settings',
            step: 'settings.wizard.step',
            webrtc: 'settings.webrtc',
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

    return WizardStepVoipaccount
}
