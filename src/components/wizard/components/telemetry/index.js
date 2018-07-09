module.exports = (app, shared) => {
    /**
    * @memberof fg.components
    */
    const WizardTelemetry = {
        computed: app.helpers.sharedComputed(),
        methods: Object.assign({
            toggleTelemetry: function(enabled) {
                app.setState({settings: {telemetry: {enabled}}}, {persist: true})
                this.stepNext()
            },
        }, shared().methods),
        render: templates.wizard_telemetry.r,
        staticRenderFns: templates.wizard_telemetry.s,
        store: {
            app: 'app',
            options: 'settings.wizard.steps.options',
            selected: 'settings.wizard.steps.selected',
            telemetry: 'settings.telemetry',
        },
    }

    return WizardTelemetry
}
