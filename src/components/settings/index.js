module.exports = (app) => {

    const v = Vuelidate.validators

    /**
    * @memberof fg.components
    */
    const Settings = {
        methods: Object.assign({
            classes: function(block, modifier) {
                let classes = {}
                if (block === 'tabs') {
                    if (modifier === 'devices' && !this.settings.webrtc.enabled) classes.disabled = true
                    if (modifier === this.tabs.active) classes['is-active'] = true
                }
                return classes
            },
            save: function(e) {
                // This event is used, so an external API may have some time
                // to retrieve credentials. This way, we don't have to store
                // full credentials of all accounts.
                let accountId = null
                if (this.settings.webrtc.toggle) accountId = this.settings.webrtc.account.selected.id
                app.emit('bg:user:account_select', {
                    accountId,
                    callback: ({account}) => {
                        // Modify properties on the cloned settings object
                        // before writing to the store.
                        let settings = app.utils.copyObject(this.settings)
                        delete settings.webrtc.account.options
                        delete settings.webrtc.account.selected
                        app.setState({availability: {dnd: false}, settings}, {persist: true})
                        app.emit('bg:calls:connect')

                        app.notify({icon: 'settings', message: app.$t('settings are updated.'), type: 'success'})

                        // Verify currently selected devices after saving settings again.
                        app.emit('bg:devices:verify-sinks')
                    },
                }, 'both')

                app.emit('bg:remote_logger:set_enabled', {
                    enabled: this.settings.telemetry.remoteLogging.enabled,
                }, 'both')

                // Update the vault settings.
                app.setState({app: {vault: this.app.vault}}, {encrypt: false, persist: true})
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
            availability: 'availability',
            devices: 'settings.webrtc.devices',
            env: 'env',
            ringtones: 'settings.ringtones',
            settings: 'settings',
            tabs: 'ui.tabs.settings',
            user: 'user',
            vendor: 'app.vendor',
        },
        validations: function() {
            let validations = {
                settings: {
                    webrtc: {
                        endpoint: {
                            uri: {
                                domain: app.helpers.validators.domain,
                                required: v.required,
                            },
                        },
                    },
                },
            }
            // Add the validation that is shared with step_voipaccount, but
            // only if the user is supposed to choose between account options.
            if (this.settings.webrtc.account.selection) {
                validations.settings.webrtc.account = app.helpers.sharedValidations.bind(this)().settings.webrtc.account
            }

            return validations
        },
        watch: {
            /**
            * Reactively change the language when the select updates.
            * @param {Object} language - Selected language.
            */
            'settings.language.selected': function(language) {
                app.logger.info(`${this} setting language to ${language.id}`)
                Vue.i18n.set(language.id)
            },
        },
    }

    return Settings
}
