module.exports = (app) => {

    return {
        computed: app.helpers.sharedComputed(),
        methods: Object.assign({
            logout: app.helpers.logout,
            openHelp: function() {
                if (app.env.isExtension) browser.tabs.create({url: process.env.HOMEPAGE})
                else window.open(process.env.HOMEPAGE, '_blank')
            },
            refreshApiData: function() {
                app.emit('bg:refresh_api_data')
                app.emit('bg:calls:disconnect', {reconnect: true})
            },
            setLayer: function(layerName) {
                app.setState({ui: {layer: layerName}}, {persist: true})
            },
        }, app.helpers.sharedMethods()),
        render: templates.main_statusbar.r,
        staticRenderFns: templates.main_statusbar.s,
        store: {
            dnd: 'availability.dnd',
            env: 'env',
            layer: 'ui.layer',
            ua: 'calls.ua',
            user: 'user',
        },
    }
}
