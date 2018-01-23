module.exports = (app, utils) => {

    return {
        computed: utils.sharedComputed(),
        methods: {
            logout: utils.logout,
            openHelp: function() {

            },
            setLayer: function(layerName) {
                app.setState({ui: {layer: layerName}}, true)
            },
        },
        render: templates.statusbar.r,
        staticRenderFns: templates.statusbar.s,
        store: {
            layer: 'ui.layer',
            sip: 'sip',
            user: 'user',
        },
    }
}
