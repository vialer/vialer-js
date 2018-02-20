module.exports = (app) => {

    return {
        computed: app.helpers.sharedComputed(),
        render: templates.main.r,
        staticRenderFns: templates.main.s,
        store: {
            calls: 'calls.calls',
            layer: 'ui.layer',
            telemetry: 'settings.telemetry',
            user: 'user',
        },
    }
}
