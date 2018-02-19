module.exports = (app) => {

    var soundMeter = false

    async function microphoneCheck() {
        try {
            soundMeter = new app.sounds.SoundMeter()
            const stream = await navigator.mediaDevices.getUserMedia({audio: true})
            soundMeter.connectToSource(stream)
            return soundMeter
        } catch (err) {
            return false
        }
    }

    return {
        data: function() {
            return {
                inputDevice: {
                    options: [],
                },
                outputDevice: {
                    options: [],
                },
                sound: {
                    enabled: true,
                    inputlevel: 0,
                },
            }
        },
        destroyed: function() {
            clearInterval(this.soundMeterInterval)
        },
        methods: Object.assign({
            playSound: function() {
                // Don't allow the user to frenzy-click the test-audio button.
                if (!this.sound.enabled) return
                const selectedSound = this.settings.ringtones.selected.name
                this.ringtone = new app.sounds.RingTone(selectedSound, false)
                this.ringtone.on('stop', () => {
                    this.sound.enabled = true
                })
                this.ringtone.play()
                this.sound.enabled = false
            },
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
        }, app.helpers.sharedMethods()),
        mounted: async function() {
            if (!soundMeter) soundMeter = await microphoneCheck()
            if (soundMeter) {
                app.state.settings.webrtc.permission = true
                this.soundMeterInterval = setInterval(() => {
                    Vue.set(this.sound, 'inputLevel', (soundMeter.instant * 2))
                }, 25)
            } else {
                app.state.settings.webrtc.permission = false
            }

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
            env: 'env',
            settings: 'settings',
            tabs: 'ui.tabs.settings',
            user: 'user',
            vendor: 'vendor',
        },
        watch: {
            // Copy changes to settings to the background state when they
            // happen, but do not persist them until the user saves. This
            // may not be completely 100% foolproof, since the changed
            // state could be saved from another setState call that DOES
            // persist. For now let's keep it like this, because it allows
            // the user to enter settings, close the popup, and re-edit
            // where it left off.
            settings: {
                deep: true,
                handler: function(newVal, oldVal) {
                    app.setState({settings: this.settings}, {persist: false})
                },
            },
            'settings.language.selected': function(newVal, oldVal) {
                Vue.i18n.set(newVal.id)
            },
            'settings.webrtc.account.selected': function(newVal, oldVal) {
                // The `options` and `selected` fields are just placeholders
                // for easier account selection. The actual username/password
                // is stored on these properties.
                this.settings.webrtc.account.username = newVal.account_id
                this.settings.webrtc.account.password = newVal.password
            },
            'settings.webrtc.permission': async function(newVal, oldVal) {
                if (!soundMeter) soundMeter = await microphoneCheck()
                if (soundMeter) {
                    this.settings.webrtc.permission = true
                    this.soundMeterInterval = setInterval(() => {
                        Vue.set(this.sound, 'inputLevel', soundMeter.instant)
                    }, 25)
                } else {
                    this.settings.webrtc.permission = false
                }
            },
        },
    }
}
