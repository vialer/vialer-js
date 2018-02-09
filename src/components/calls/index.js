module.exports = (app) => {

    return {
        computed: app.utils.sharedComputed(),
        mounted: function() {
            if (Object.keys(this.calls).length === 0) {
                app.emit('bg:calls:call_create', {number: null, start: null})
            }
        },
        props: ['calls'],
        render: templates.calls.r,
        staticRenderFns: templates.calls.s,
        store: {},
    }
}
