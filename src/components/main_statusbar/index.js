module.exports = (app) => {
    /**
    * @memberof fg.components
    */
    const MainStatusbar = {
        computed: app.helpers.sharedComputed(),
        methods: Object.assign({
            logout: app.helpers.logout,
            refreshApiData: function() {
                this.$notify({icon: 'refresh', message: `${app.$t('Reloaded application data')}...`, type: 'success'})
                app.emit('bg:refresh_api_data')
                app.emit('bg:calls:disconnect', {reconnect: true})
            },
            titles: function(block) {
                let title = ''
                if (block === 'indicator') {
                    title += `${this.$t('Status:')} `
                    if (this.ua.state === 'disconnected') title += this.$t('disconnected')
                    else if (this.ua.state === 'connected') {
                        title += `${this.$t('connected')} (${this.$t('ConnectAB')})`
                    } else if (this.ua.state === 'registered') {
                        title += this.$t('registered')
                        if (!this.settings.webrtc.permission) {
                            title += ` (${this.$t('no microphone access')})`
                        } else if (this.dnd) title += ` (${this.$t('Do not Disturb')})`
                        else title += ` (${this.$t('WebRTC')})`
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
            vendor: 'app.vendor',
        },
    }

    return MainStatusbar
}
