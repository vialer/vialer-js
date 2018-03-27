module.exports = (app) => {
    /**
    * @memberof fg.components
    */
    const About = {
        methods: app.helpers.sharedMethods(),
        render: templates.about.r,
        staticRenderFns: templates.about.s,
        store: {
            app: 'app',
            user: 'user',
            vendor: 'app.vendor',
        },
    }

    return About
}
