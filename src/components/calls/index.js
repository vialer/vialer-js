module.exports = (app) => {

    return {
        computed: app.helpers.sharedComputed(),
        methods: {
            classes: function(block) {
                let classes = {}

                if (block === 'component') {
                    if (this.callOngoing) classes['call-ongoing'] = true
                }
                return classes
            },
        },
        mounted: function() {
            // Make sure there is always a Call object available when
            // viewing the calls component.
            if (Object.keys(this.calls).length === 0) {
                app.emit('bg:calls:call_create', {number: null, start: null})
            }
        },
        render: templates.calls.r,
        staticRenderFns: templates.calls.s,
        store: {
            calls: 'calls.calls',
        },
        watch: {
            calls: {
                deep: true,
                handler: function(val) {
                    // Make sure there is always at least one empty call when
                    // dealing with this component.
                    if (Object.keys(this.calls).length === 0) {
                        app.emit('bg:calls:call_create', {number: null, start: null})
                    }
                },
            },
        },
    }
}
