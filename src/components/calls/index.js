module.exports = (app) => {

    return {
        computed: app.helpers.sharedComputed(),
        mounted: function() {
            if (Object.keys(this.calls).length === 0) {
                app.emit('bg:calls:call_create', {number: null, start: null})
            }
        },
        props: ['calls'],
        render: templates.calls.r,
        staticRenderFns: templates.calls.s,
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
