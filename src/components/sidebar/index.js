module.exports = (app) => {
    return {
        methods: {
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
            layer: 'ui.layer',
            user: 'user',
        },
    }
}
