module.exports = (app) => {

    return {
        methods: app.helpers.sharedMethods(),
        render: templates.about.r,
        staticRenderFns: templates.about.s,
        store: {
            app: 'app',
            user: 'user',
            vendor: 'app.vendor',
        },
    }
}
