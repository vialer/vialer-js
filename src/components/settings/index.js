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


    /**
    * @memberof fg.components
    */
    const Settings = {
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
                app.setState({ui: {tabs: {settings: {active: name}}}}, {encrypt: false, persist: true})
            },
        }, app.helpers.sharedMethods()),
        mounted: async function() {
            // Immediatly triger validation on the fields.
            this.$v.$touch()

            if (!soundMeter) soundMeter = await microphoneCheck()
            if (soundMeter) {
                app.state.settings.webrtc.permission = true
                this.soundMeterInterval = setInterval(() => {
                    window.requestAnimationFrame(() => {
                        Vue.set(this.sound, 'inputLevel', soundMeter.slow)
                    })
                }, 10)
            } else {
                // Still no soundMeter? Something terrible happened
                // and we can't use WebRTC now.
                app.state.settings.webrtc.permission = false
            }

            // Query devices and fill the store with them. This is
            // currently a feature behind a developer flag, because
            // its not stable yet.
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
                console.error(err)
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
                    platform: {
                        url: {
                            required: v.required,
                            url: v.url,
                        },
                    },
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
            /**
            * Reactively change the language when the select updates.
            * @param {Object} newVal - New select value.
            * @param {Object} oldVal - Old select value.
            */
            'settings.language.selected': function(newVal, oldVal) {
                Vue.i18n.set(newVal.id)
            },
            /**
            * The switch to toggle the softphone. This is a bit more complicated
            * because the store data that is used to setup the connection, e.g.
            * `settings.webrtc.account`, is not directly bound to the VoIP-account
            * selection
            * @param {Object} newVal - New checkbox/switch value.
            * @param {Object} oldVal - Old checkbox/switch value.
            */
            'settings.webrtc.enabled': function(newVal, oldVal) {
                if (newVal) {
                    // No option is set in the VoIP-account select yet.
                    // This is required. Help the user by setting the first
                    // account as the default. An info-message is shown if
                    // there are no accounts yet.
                    if (!this.settings.webrtc.account.selected.username) {
                        // There are options to choose from.
                        if (this.settings.webrtc.account.options.length) {
                            this.settings.webrtc.account.selected = this.settings.webrtc.account.options[0]
                        }
                    }
                } else {
                    this.settings.webrtc.account.selected = {id: null, name: null, password: null, username: null}
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

    return Settings
}
