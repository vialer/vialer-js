module.exports = (app) => {

    return {
        computed: app.helpers.sharedComputed(),
        methods: {
            classes: function(block) {
                let classes = {}
                // We assume here that a block is always an option. Change
                // this logic if other kind of blocks are required.
                classes.active = (this.layer === block)

                if (block === 'availability') {
                    if (this.available) classes.available = true
                    else classes.unavailable = true
                } else if (block === 'calls') {
                    classes['calls-active'] = this.callOngoing
                } else if (block === 'contacts') {
                    classes.hint = (this.transferStatus === 'select')
                } else if (block === 'queues') {
                    classes.hint = (this.transferStatus === 'select')
                }

                return classes
            },
            logout: app.helpers.logout,
            setLayer: function(layerName) {
                this.layer = layerName
                app.emit('bg:set_state', {
                    persist: true,
                    state: {
                        ui: this.$store.ui,
                    },
                })
            },
        },
        render: templates.main_menubar.r,
        staticRenderFns: templates.main_menubar.s,
        store: {
            available: 'availability.available',
            layer: 'ui.layer',
        },
    }
}
