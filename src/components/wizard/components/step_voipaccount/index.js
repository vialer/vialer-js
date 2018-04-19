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
            step: 'settings.wizard.step',
            webrtc: 'settings.webrtc',
        },
    }

    return WizardStepVoipaccount
}
