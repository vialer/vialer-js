module.exports = (app) => {

    const v = Vuelidate.validators

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
            classes: function(block, modifier) {
                let classes = {}
                if (block === 'tabs') {
                    if (modifier === 'audio' && !this.settings.webrtc.enabled) classes.disabled = true
                    if (modifier === this.tabs.active) classes['is-active'] = true
                }
                return classes
            },
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
                    // Disable dnd after a save to keep condition checks simple.
                    availability: {dnd: false},
                    settings: this.settings,
                }, {persist: true})

                app.vm.$notify({icon: 'settings', message: app.$t('Settings stored'), type: 'success'})
                app.emit('bg:calls:connect')
            },
        }, app.helpers.sharedMethods()),
        mounted: async function() {
            // Immediatly triger validation on the fields.
            this.$v.$touch()
            // Query devices and fill the store with them. This is
            // currently a feature behind a developer flag, because
            // its not stable yet.
            try {
                const devices = await navigator.mediaDevices.enumerateDevices()
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
            } catch (err) {
                console.error(err)
            }
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
        },
    }

    return Settings
}
