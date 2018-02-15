module.exports = (app) => {

    return {
        computed: Object.assign({
            statusbarActive: function() {
                const calls = this.$store.calls.calls
                const callIds = Object.keys(this.$store.calls.calls)
                // Calls component haven't been activated.
                if (!callIds.length) return true
                // User wants to create its first call.
                if (callIds.length === 1 && calls[callIds[0]].status === 'new') {
                    return true
                }
                return false
            },
        }, app.helpers.sharedComputed()),
        render: templates.main.r,
        staticRenderFns: templates.main.s,
        store: app.state,
    }
}
