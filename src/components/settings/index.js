module.exports = (app) => {
    return {
        data: function() {
            return {
                inputDevice: {
                    options: [],
                },
                outputDevice: {
                    options: [],
                },
            }
        },
        methods: {
            save: function(e) {
                app.emit('bg:set_state', {
                    persist: true,
                    state: {
                        settings: this.settings,
                    },
                })
                app.vm.$notify({icon: 'database', message: app.$t('Settings stored'), type: 'info'})
                app.emit('bg:calls:connect')
            },
            setTab: function(name) {
                app.setState({ui: {tabs: {settings: {active: name}}}}, {persist: true})
            },
        },
        mounted: function() {
            navigator.mediaDevices.enumerateDevices().then((devices) => {
                for (const device of devices) {
                    if (device.kind === 'audioinput') {
                        this.inputDevice.options.push({
                            id: device.deviceId,
                            name: device.label,
                        })
                    } else if (device.kind === 'audiooutput') {
                        this.outputDevice.options.push({
                            id: device.deviceId,
                            name: device.label,
                        })
                    }
                }
            }).catch((err) => {
                console.log('ERROR', err)
            })
        },
        render: templates.settings.r,
        staticRenderFns: templates.settings.s,
        store: {
            settings: 'settings',
            tabs: 'ui.tabs.settings',
            user: 'user',
            vendor: 'vendor',
        },
        watch: {
            // Copy changes to settings to the background state when they
            // happen, but do not persist them until the user saves.
            settings: {
                deep: true,
                handler: function(newVal, oldVal) {
                    app.setState({settings: this.settings}, {persist: false})
                },
            },
        },
    }
}
