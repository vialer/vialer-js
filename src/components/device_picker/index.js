module.exports = (app) => {

    const v = Vuelidate.validators

    /**
    * @memberof fg.components
    */
    const DevicePicker = {
        data: function() {
            return {
                playing: {
                    headsetOutput: false,
                    ringOutput: false,
                    speakerOutput: false,
                },
            }
        },
        methods: {
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
        },
        mounted: function() {
            this.$v.$touch()
        },
        render: templates.device_picker.r,
        staticRenderFns: templates.device_picker.s,
        store: {
            app: 'app',
            availability: 'availability',
            devices: 'settings.webrtc.devices',
            env: 'env',
            permission: 'settings.webrtc.media.permission',
            ringtones: 'settings.ringtones',
            settings: 'settings',
            user: 'user',
            vendor: 'app.vendor',
        },
        validations: function() {
            const sinkErrormessage = app.$t('selected audio device is not available.')
            return {
                settings: {
                    platform: {
                        url: {
                            required: v.required,
                            url: v.url,
                        },
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
                                            const storedDevice = this.devices.output.find((i) => i.id === ringOutput.id)
                                            if (storedDevice) return storedDevice.valid
                                            return true
                                        }),
                                    },
                                },
                            },
                        },
                        endpoint: {
                            domain: app.helpers.validators.domain,
                            required: v.required,
                        },
                    },
                },
            }
        },

    }

    return DevicePicker
}
