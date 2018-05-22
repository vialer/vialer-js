module.exports = (app) => {

    const v = Vuelidate.validators

    /**
    * @memberof fg.components
    */
    const Settings = {
        data: function() {
            return {
                playing: {
                    headsetOutput: false,
                    ringOutput: false,
                    speakerOutput: false,
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
            playSound: function(soundName, sinkTarget) {
                this.playing[sinkTarget] = true

                if (app.sounds[soundName].off) {
                    // Prevent frenzy-clicking the test-audio button.
                    if (app.sounds[soundName].playing) return

                    app.sounds[soundName].play(false, this.devices.sinks[sinkTarget])
                    app.sounds[soundName].off('stop').on('stop', () => {
                        this.playing[sinkTarget] = false
                    })
                } else {
                    // Prevent frenzy-clicking the test-audio button.
                    if (app.sounds[soundName].started) return

                    app.sounds[soundName].play(this.devices.sinks[sinkTarget])
                    setTimeout(() => {
                        app.sounds[soundName].stop()
                        this.playing[sinkTarget] = false
                    }, 2500)
                }
            },
            save: function(e) {
                app.setState({
                    // Disable dnd after a save to keep condition checks simple.
                    availability: {dnd: false},
                    settings: this.settings,
                }, {persist: true})

                // Disable dnd after a save to keep condition checks simple.
                app.setState({app: {vault: this.app.vault}}, {encrypt: false, persist: true})
                app.vm.$notify({icon: 'settings', message: app.$t('settings stored'), type: 'success'})
                app.emit('bg:calls:connect')
            },
        }, app.helpers.sharedMethods()),
        mounted: async function() {
            // Immediatly triger validation on the fields.
            this.$v.$touch()
        },
        render: templates.settings.r,
        staticRenderFns: templates.settings.s,
        store: {
            app: 'app',
            devices: 'settings.webrtc.devices',
            env: 'env',
            ringtones: 'settings.ringtones',
            settings: 'settings',
            tabs: 'ui.tabs.settings',
            user: 'user',
            vendor: 'app.vendor',
        },
        validations: function() {
            const sinkErrormessage = app.$t('selected audio device is not available.')
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
                        devices: {
                            sinks: {
                                headsetInput: {
                                    valid: {
                                        customValid: Vuelidate.withParams({
                                            message: sinkErrormessage,
                                            type: 'customValid',
                                        }, (valid, headsetInput) => {
                                            if (!this.settings.webrtc.enabled) return true
                                            const storedDevice = this.devices.input.find((i) => i.id === headsetInput.id)
                                            if (storedDevice) return storedDevice.valid
                                            return true
                                        }),
                                    },
                                },
                                headsetOutput: {
                                    valid: {
                                        customValid: Vuelidate.withParams({
                                            message: sinkErrormessage,
                                            type: 'customValid',
                                        }, (valid, headsetOutput) => {
                                            if (!this.settings.webrtc.enabled) return true
                                            const storedDevice = this.devices.output.find((i) => i.id === headsetOutput.id)
                                            if (storedDevice) return storedDevice.valid
                                            return false
                                        }),
                                    },
                                },
                                ringOutput: {
                                    valid: {
                                        customValid: Vuelidate.withParams({
                                            message: sinkErrormessage,
                                            type: 'customValid',
                                        }, (valid, ringOutput) => {
                                            if (!this.settings.webrtc.enabled) return true
                                            const storedDevice = this.devices.output.find((i) => i.id === ringOutput.id)
                                            if (storedDevice) return storedDevice.valid
                                            return true
                                        }),
                                    },
                                },
                            },
                        },
                    },
                },
            }
            // Add the validation that is shared with step_voipaccount.
            validations.settings.webrtc.account = app.helpers.sharedValidations.bind(this)().settings.webrtc.account
            return validations
        },
        watch: {
            /**
            * Change the sink for the ringtone when the selected
            * ringtone device changes.
            * @param {String} newSinkId - The selected sink for sounds.
            */
            'devices.sounds.selected.id': function(newSinkId) {
                if (newSinkId) app.sounds.ringTone.audio.setSinkId(newSinkId)
            },
            /**
            * Reactively change the language when the select updates.
            * @param {Object} language - Selected language.
            */
            'settings.language.selected': function(language) {
                Vue.i18n.set(language.id)
            },
        },
    }

    return Settings
}
