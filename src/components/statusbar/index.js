module.exports = (app) => {

    return {
        computed: app.utils.sharedComputed(),
        methods: {
            logout: app.utils.logout,
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
                app.emit('bg:calls:disconnect', {reconnect: true})
            },
            setLayer: function(layerName) {
                app.setState({ui: {layer: layerName}}, {persist: true})
            },
        },
        render: templates.statusbar.r,
        staticRenderFns: templates.statusbar.s,
        store: {
            env: 'env',
            layer: 'ui.layer',
            ua: 'calls.ua',
            user: 'user',
        },
    }
}
