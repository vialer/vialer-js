module.exports = (app) => {

    const v = Vuelidate.validators

    /**
    * @memberof fg.components
    */
    const Settings = {
        data: function() {
            return {
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
                if (app.sounds.ringTone.playing) return

                app.sounds.ringTone.off('stop').on('stop', () => {
                    this.sound.enabled = true
                })
                app.sounds.ringTone.play(false)
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
        },
        render: templates.settings.r,
        staticRenderFns: templates.settings.s,
        store: {
            app: 'app',
            devices: 'settings.webrtc.media.devices',
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
                            validVoipSettings: app.helpers.validVoipSettings,
                        },
                    },
                },
            }

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
