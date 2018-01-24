module.exports = (app, utils) => {

    return {
        computed: utils.sharedComputed(),
        methods: {
            logout: utils.logout,
            openHelp: function() {
                if (app.env.isExtension) browser.tabs.create({url: process.env.HOMEPAGE})
                else window.open(process.env.HOMEPAGE, '_blank')
            },
            openPopoutView: function() {
                // This is only available in extensions.
                if (app.env.isExtension) {
                    browser.tabs.create({url: browser.runtime.getURL('index.html?popout=true')})
                }
            },
            refreshApiData: function() {
                app.emit('bg:refresh_api_data')
                app.emit('bg:sip:disconnect', {reconnect: true})
            },
            setLayer: function(layerName) {
                app.setState({ui: {layer: layerName}}, true)
            },
        },
        render: templates.statusbar.r,
        staticRenderFns: templates.statusbar.s,
        store: {
            env: 'env',
            layer: 'ui.layer',
            sip: 'sip',
            user: 'user',
        },
    }
}
