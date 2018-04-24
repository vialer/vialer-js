module.exports = (app) => {

    const emptyAccount = {id: null, name: null, password: null, username: null}
    const v = Vuelidate.validators

    /**
    * @memberof fg.components
    */
    const WizardStepWelcome = {
        computed: app.helpers.sharedComputed(),
        methods: Object.assign({
            refreshVoipaccounts: function() {
                // Call the API endpoint that is responsible for updating
                // the user's voipaccount list.
                app.emit('bg:availability:platform_data')
            },
        }, app.helpers.sharedMethods()),
        props: {
            info: {default: true},
            label: {default: ''},
        },
        render: templates.voipaccount_picker.r,
        staticRenderFns: templates.voipaccount_picker.s,
        store: {
            app: 'app',
            settings: 'settings',
            user: 'user',
            vendor: 'app.vendor',
        },
        validations: function() {
            let validations = {
                settings: {
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
            * Respond to updates of the VoIPaccount list associated with the user.
            * @param {Array} options - Reactive array with VoIP account options.
            */
            'settings.webrtc.account.options': function(options) {
                const selectedId = this.settings.webrtc.account.selected.id
                if (selectedId && options.length) {
                    // Make sure that a previous choice is still part of the
                    // available choices. Select the first option if it isn't.
                    if (!options.find((i) => i.id === selectedId)) {
                        app.setState({settings: {webrtc: {account: {selected: this.settings.webrtc.account.options[0]}}}}, {persist: true})
                    }
                } else {
                    if (!options.length) {
                        // Nothing selected and no options. Select an empty placeholder.
                        app.setState({settings: {webrtc: {account: {selected: emptyAccount}}}}, {persist: true})
                    } else {
                        // Nothing selected; but there are available options. Select the first option.
                        app.setState({settings: {webrtc: {account: {selected: this.settings.webrtc.account.options[0]}}}}, {persist: true})
                    }
                }
            },
            /**
            * Respond to toggling the softphone on and off by unsetting the
            * selected VoIP-account or by selecting the first option by
            * default.
            * @param {Object} webrtcEnabled - New checkbox/switch value.
            */
            'settings.webrtc.enabled': function(webrtcEnabled) {
                if (webrtcEnabled) {
                    // No option is set in the VoIP account select yet.
                    // This is required. Help the user by setting the first
                    // account as the default. An info-message is shown if
                    // there are no accounts yet.
                    if (!this.settings.webrtc.account.selected.username) {
                        // There are options to choose from.
                        if (this.settings.webrtc.account.options.length) {
                            app.setState({settings: {webrtc: {account: {selected: this.settings.webrtc.account.options[0]}}}}, {persist: true})
                        }
                    }
                } else {
                    app.setState({settings: {webrtc: {account: {selected: emptyAccount}}}}, {persist: true})
                }
            },
        },
    }

    return WizardStepWelcome
}
