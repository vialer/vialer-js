module.exports = (app, actions) => {

    return {
        methods: {
            logout: actions.logout,
            setLayer: function(layerName) {
                app.setState({ui: {layer: layerName}}, true)
            },
        },
        render: templates.statusbar.r,
        staticRenderFns: templates.statusbar.s,
        store: {
            layer: 'ui.layer',
            user: 'user',
        },
    }
}
