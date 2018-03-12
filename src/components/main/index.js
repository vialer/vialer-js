module.exports = (app) => {

    return {
        computed: app.helpers.sharedComputed(),
        methods: {
            classes: function(block) {
                let classes = {}

                if (block === 'notifications') {
                    if (!['login', 'unlock'].includes(this.layer)) {
                        classes.sidebar = true
                    }
                } else if (block === 'panel') {
                    if (!['login', 'unlock'].includes(this.layer)) {
                        classes.sidebar = true
                    }
                }

                return classes
            },
        },
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
