module.exports = (app) => {
    /**
    * @memberof fg.components
    */
    const Main = {
        computed: app.helpers.sharedComputed(),
        methods: Object.assign({
            classes: function(block) {
                let classes = {}

                if (block === 'notifications') {
                    if (this.user.authenticated) {
                        classes.sidebar = true
                    }
                } else if (block === 'panel') {
                    if (this.user.authenticated) classes.sidebar = true
                    if (this.overlay) classes['no-scroll'] = true
                }

                return classes
            },
        }, app.helpers.sharedMethods()),
        render: templates.main.r,
        staticRenderFns: templates.main.s,
        store: {
            calls: 'calls.calls',
            layer: 'ui.layer',
            overlay: 'ui.overlay',
            telemetry: 'settings.telemetry',
            user: 'user',
            wizard: 'settings.wizard',
        },
    }

    return Main
}
