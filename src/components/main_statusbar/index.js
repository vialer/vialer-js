module.exports = (app) => {
    /**
    * @memberof fg.components
    */
    const MainStatusbar = {
        computed: app.helpers.sharedComputed(),
        methods: Object.assign({
            classes: function(block) {
                let classes = {}
                if (block === 'component') {
                    if (this.user.authenticated) {
                        if (this.ua.status === 'disconnected') classes.error = true
                        else if (!this.settings.webrtc.enabled) classes.notice = true
                        else if (!this.settings.webrtc.media.permission) classes.error = true
                        else if (this.dnd) classes.warning = true
                        else classes.default = true
                    } else classes.default = true
                }
                return classes
            },
            logout: app.helpers.logout,
            refreshApiData: function() {
                if (!this.app.online) return
                this.$notify({icon: 'refresh', message: `${app.$t('Reloaded application data')}...`, type: 'success'})
                app.emit('bg:refresh_api_data')
                app.emit('bg:calls:disconnect', {reconnect: true})
            },
            titles: function(block) {
                let title = ''
                if (block === 'indicator') {
                    title += `${this.$t('Status:')} `
                    if (['disconnected', 'reconnect'].includes(this.ua.status)) {
                        title += this.$t('no connection')
                        // Give an indication why we are not connected.
                        if (!this.app.online) {
                            title += ` (${this.$t('offline')})`
                        }
                    } else if (this.ua.status === 'connected') {
                        title += `${this.$t('connected')} (${this.$t('ConnectAB')})`
                    } else if (this.ua.status === 'registered') {
                        title += this.$t('registered')
                        if (!this.settings.webrtc.media.permission) {
                            title += ` (${this.$t('no microphone access')})`
                        } else if (this.dnd) title += ` (${this.$t('Do not Disturb')})`
                        else title += ` (${this.$t('WebRTC')})`
                    } else if (this.ua.status === 'registration_failed') {
                        title += this.$t('registration failed')
                    }
                }
                return title
            },
        }, app.helpers.sharedMethods()),
        render: templates.main_statusbar.r,
        staticRenderFns: templates.main_statusbar.s,
        store: {
            app: 'app',
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
