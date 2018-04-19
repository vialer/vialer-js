module.exports = (app) => {

    /**
    * @memberof fg.components
    */
    const WizardStepTelemetry = {
        computed: app.helpers.sharedComputed(),
        methods: Object.assign({
            toggleTelemetry: function(enabled) {
                // Go to the next wizard step manually, because the
                // wizard next button isn't used within this step.
                app.setState({settings: {telemetry: {enabled}, wizard: {step: this.step += 1}}}, {persist: true})
            },
        }, app.helpers.sharedMethods()),
        render: templates.wizard_step_telemetry.r,
        staticRenderFns: templates.wizard_step_telemetry.s,
        store: {
            step: 'settings.wizard.step',
            telemetry: 'settings.telemetry',
        },
    }

    return WizardStepTelemetry
}
