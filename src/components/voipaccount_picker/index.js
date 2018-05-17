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
            this.validationField = this.v.settings.webrtc.account.selected.id
            const selectedId = this.settings.webrtc.account.selected.id
            if (!selectedId) {
                let selected
                if (this.settings.webrtc.account.options.length) {
                    selected = app.utils.copyObject(this.settings.webrtc.account.options[0])
                    app.setState({settings: {webrtc: {account: {selected}}}}, {persist: true})
                }
            }
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
                        const selected = app.utils.copyObject(this.settings.webrtc.account.options[0])
                        app.setState({settings: {webrtc: {account: {selected}}}}, {persist: true})
                    }
                } else {
                    if (!options.length) {
                        // Nothing selected and no options. Select an empty placeholder
                        // and disable webrtc alltogether.
                        app.setState({settings: {webrtc: {account: {selected: emptyAccount}, enabled: false}}}, {persist: true})
                    } else {
                        // Nothing selected; but there are available options. Select the first option.
                        const selected = app.utils.copyObject(this.settings.webrtc.account.options[0])
                        app.setState({settings: {webrtc: {account: {selected}}}}, {persist: true})
                    }
                }

                if (this.v) this.v.$touch()
            },
            /**
            * Respond to toggling the softphone on and off by unsetting the
            * selected VoIP account or by selecting the first option by
            * default.
            * @param {Object} webrtcEnabled - New checkbox/switch value.
            */
            'settings.webrtc.enabled': function(webrtcEnabled) {
                if (this.v) this.v.$touch()
            },
        },
    }

    return VoipaccountPicker
}
