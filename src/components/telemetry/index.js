module.exports = (app) => {

    return {
        computed: app.helpers.sharedComputed(),
        methods: Object.assign({
            toggleTelemetry: function(enabled) {
                app.setState({settings: {telemetry: {enabled}}}, {persist: true})
            },
        }, app.helpers.sharedMethods()),
        render: templates.telemetry.r,
        staticRenderFns: templates.telemetry.s,
        store: {
            telemetry: 'settings.telemetry',
        },
    }
}
