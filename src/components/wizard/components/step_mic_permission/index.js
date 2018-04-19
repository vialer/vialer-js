module.exports = (app) => {
    /**
    * @memberof fg.components
    */
    const WizardStepWelcome = {
        computed: app.helpers.sharedComputed(),
        render: templates.wizard_step_mic_permission.r,
        staticRenderFns: templates.wizard_step_mic_permission.s,
        store: {
            app: 'app',
            step: 'settings.wizard.step',
        },
    }

    return WizardStepWelcome
}
