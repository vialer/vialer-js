module.exports = (app) => {

    const v = Vuelidate.validators

    /**
    * @memberof fg.components
    */
    const WizardStepWelcome = {
        computed: app.helpers.sharedComputed(),
        methods: Object.assign({
            nextStep: function() {
                this.step += 1
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
            * The switch to toggle the softphone. This is a bit more complicated
            * because the store data that is used to setup the connection, e.g.
            * `settings.webrtc.account`, is not directly bound to the VoIP-account
            * selection
            * @param {Object} webrtcEnabled - New checkbox/switch value.
            */
            'settings.webrtc.enabled': function(webrtcEnabled) {
                if (webrtcEnabled) {
                    // No option is set in the VoIP-account select yet.
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
                    const emptyAccount = {id: null, name: null, password: null, username: null}
                    app.setState({settings: {webrtc: {account: {selected: emptyAccount}}}}, {persist: true})
                }
            },
        },
    }

    return WizardStepWelcome
}
