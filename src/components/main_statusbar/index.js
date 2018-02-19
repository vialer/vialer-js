module.exports = (app) => {

    return {
        computed: app.helpers.sharedComputed(),
        methods: Object.assign({
            classes: function(block) {
                let classes = {}
                if (block === 'indicator') {
                    if (this.ua.state === 'disconnected') {
                        classes['icon-disconnected'] = true
                    } else if (this.ua.state === 'connected') {
                        classes.connected = true
                        classes['icon-vialer-icon'] = true
                    } else if (this.ua.state === 'registered') {
                        if (this.settings.webrtc.permission) {
                            classes.registered = true
                            classes['icon-vialer-icon'] = true
                        } else {
                            classes['microphone-denied'] = true
                            classes.fa = true
                            classes['fa-microphone'] = true
                        }
                    } else if (this.ua.state === 'registration_failed') {
                        classes['icon-disconnected'] = true
                        classes['registration-failed'] = true
                    }
                }
                return classes
            },
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
            titles: function(block) {
                let title = ''
                if (block === 'indicator') {
                    title += `${this.$t('Status:')} `
                    if (this.ua.state === 'disconnected') title += this.$t('disconnected')
                    else if (this.ua.state === 'connected') title += this.$t('connected')
                    else if (this.ua.state === 'registered') {
                        title += this.$t('registered')
                        if (!this.settings.webrtc.permission) {
                            title += ` (${this.$t('no microphone access')})`
                        }
                    } else if (this.ua.state === 'registration_failed') title += this.$t('registration failed')
                }
                return title
            },
        }, app.helpers.sharedMethods()),
        render: templates.main_statusbar.r,
        staticRenderFns: templates.main_statusbar.s,
        store: {
            dnd: 'availability.dnd',
            env: 'env',
            layer: 'ui.layer',
            settings: 'settings',
            ua: 'calls.ua',
            user: 'user',
        },
    }
}
