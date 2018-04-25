module.exports = (app) => {

    const emptyAccount = {id: null, name: null, password: null, username: null}
    /**
    * @memberof fg.components
    */
    const VoipaccountPicker = {
        computed: app.helpers.sharedComputed(),
        data: function() {
            return {
                loading: false,
                validationField: null,
            }
        },
        methods: Object.assign({
            refreshVoipaccounts: function() {
                // Call the API endpoint that is responsible for updating
                // the user's voipaccount list.
                this.loading = true
                app.emit('bg:availability:platform_data', {
                    callback: () => {
                        this.loading = false
                    },
                })
            },
        }, app.helpers.sharedMethods()),
        mounted: function() {
            if (this.v) this.validationField = this.v.settings.webrtc.account.selected.id
        },
        props: {
            info: {default: true},
            label: {default: ''},
            v: {default: null}, // Optionally pass a Vuelidate validator.
        },
        render: templates.voipaccount_picker.r,
        staticRenderFns: templates.voipaccount_picker.s,
        store: {
            app: 'app',
            selected: 'settings.webrtc.account.selected',
            settings: 'settings',
            user: 'user',
            vendor: 'app.vendor',
        },
        watch: {
            /**
            * Respond to updates of the VoIPaccount list associated with the user.
            * @param {Array} options - Reactive array with VoIP account options.
            */
            'settings.webrtc.account.options': function(options) {
                const selectedId = this.settings.webrtc.account.selected.id
                if (selectedId && options.length) {
                    // Always update the selected option from the updated
                    // option list, because a setting may have changes.
                    // Select the first option if it isn't.
                    const match = options.find((i) => i.id === selectedId)
                    if (match) {
                        app.setState({settings: {webrtc: {account: {selected: match}}}}, {persist: true})
                    } else {
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

                if (this.v) this.v.$touch()
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
                if (this.v) this.v.$touch()
            },
        },
    }

    return VoipaccountPicker
}
