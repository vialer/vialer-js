module.exports = (app) => {

    return {
        computed: app.utils.sharedComputed(),
        methods: {
            classes: function(block) {
                let classes = {}
                // We assume here that a block is always an option. Change
                // this logic if other kind of blocks are required.
                classes.active = (this.layer === block)

                if (block === 'availability') {
                    if (this.available === 'yes') classes.available = true
                    if (this.available === 'no') classes.unavailable = true
                } else if (block === 'calls') {
                    classes['calls-active'] = this.callsActive
                } else if (block === 'contacts') {
                    classes.hint = (this.transferStatus === 'select')
                } else if (block === 'queues') {
                    classes.hint = (this.transferStatus === 'select')
                }

                return classes
            },
            logout: app.utils.logout,
            setLayer: function(layerName) {
                this.$store.ui.layer = layerName
                app.emit('bg:set_state', {
                    persist: true,
                    state: {
                        ui: this.$store.ui,
                    },
                })
            },
        },
        render: templates.sidebar.r,
        staticRenderFns: templates.sidebar.s,
        store: {
            available: 'availability.available',
            calls: 'calls.calls',
            layer: 'ui.layer',
            user: 'user',
        },
    }
}
