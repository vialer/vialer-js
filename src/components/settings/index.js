module.exports = (app) => {

    var soundMeter = false
    const v = Vuelidate.validators

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
                app.setState({
                    availability: {dnd: false}, // Disable dnd after a save to keep conditions simple.
                    settings: this.settings,
                }, {persist: true})

                app.vm.$notify({icon: 'settings', message: app.$t('Settings stored'), type: 'success'})
                app.emit('bg:calls:connect')
            },
            setTab: function(name) {
                app.setState({ui: {tabs: {settings: {active: name}}}}, {persist: true})
            },
        }, app.helpers.sharedMethods()),
        mounted: async function() {
            // State was modified; form was set invalid in the meanwhile.
            if (this.settings._form.invalid) this.$v.$touch()
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
            app: 'app',
            env: 'env',
            settings: 'settings',
            tabs: 'ui.tabs.settings',
            user: 'user',
            vendor: 'app.vendor',
        },
        validations: function() {
            let validations = {
                settings: {
                    sipEndpoint: {
                        domain: app.helpers.validators.domain,
                        required: v.required,
                    },
                    webrtc: {
                        account: {
                            selected: {
                                id: {
                                    requiredIf: v.requiredIf(() => {
                                        return this.settings.webrtc.enabled
                                    }),
                                },
                            },
                        },
                    },
                },
            }

            return validations
        },
        watch: {
            settings: {
                deep: true,
                handler: function(newVal, oldVal) {
                    if (this.$v.$invalid) this.settings._form.invalid = true
                    else this.settings._form.invalid = false
                },
            },
            'settings.language.selected': function(newVal, oldVal) {
                Vue.i18n.set(newVal.id)
            },
            'settings.webrtc.account.selected': function(newVal, oldVal) {
                // The `options` and `selected` fields are placeholders
                // for easier account selection. The actual username/password
                // is stored in these properties.
                this.settings.webrtc.account.username = newVal.account_id
                this.settings.webrtc.account.password = newVal.password
            },
            'settings.webrtc.enabled': function(newVal, oldVal) {
                if (!this.settings.platform.enabled) return
                // Sync the platform credentials field when enabling the softphone.
                if (newVal) {
                    this.settings.webrtc.account.username = this.settings.webrtc.account.selected.account_id
                    this.settings.webrtc.account.password = this.settings.webrtc.account.selected.password
                }
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
