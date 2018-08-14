module.exports = (app) => {
    /**
    * @memberof fg.components
    */
    const AccountPicker = {
        computed: Object.assign({
            validationField: function() {
                if (this.status === 'loading') return null
                return this.v.settings.webrtc.account.selected.id
            },
        }, app.helpers.sharedComputed()),
        methods: Object.assign({
            refreshAccounts: function() {
                // Call the API endpoint that is responsible for updating
                // the user's voipaccount list.
                app.emit('bg:availability:platform_data')
            },
        }, app.helpers.sharedMethods()),
        mounted: function() {
            if (this.v) this.v.$touch()
            if (this.v) this.v.$reset()

            // Small hack to satisfy validation when the account options
            // are already loaded, before the user enters this component
            // in the wizard.
            if (this.settings.webrtc.account.options.length) {
                const selected = this.settings.webrtc.account.options[0]
                Object.assign(app.state.settings.webrtc.account.selected, selected)
            }
        },
        props: {
            info: {default: true},
            label: {default: ''},
            v: {default: null}, // Optionally pass a Vuelidate validator.
        },
        render: templates.account_picker.r,
        staticRenderFns: templates.account_picker.s,
        store: {
            app: 'app',
            selected: 'settings.webrtc.account.selected',
            settings: 'settings',
            status: 'settings.webrtc.account.status',
            user: 'user',
            vendor: 'app.vendor',
            voip: 'availability.voip',
        },
        watch: {
            /**
            * Respond to updates of the account list. There may be
            * validation errors caused by an account's settings.
            * Refreshing the list triggers validation with
            * validation rules for the refreshed account list.
            * @param {Array} options - Reactive array with VoIP account options.
            */
            'settings.webrtc.account.options': function(options) {
                const account = this.settings.webrtc.account.selected
                if (account.id && options.length) {
                    // Always update the selected option from the updated
                    // option list, because a setting may have changes.
                    // Select the first option if it isn't.
                    const match = options.find((i) => i.id === account.id)
                    if (match) {
                        Object.assign(app.state.settings.webrtc.account.selected, match)
                    }
                } else if (options.length && (app.state.settings.webrtc.enabled || app.state.settings.webrtc.toggle)) {
                    // Nothing selected; but there are available options and
                    // we are currently in either a WebRTC modus or about to
                    // go to WebRTC modus: Select the first available option.
                    const selected = app.utils.copyObject(this.settings.webrtc.account.options[0])
                    Object.assign(app.state.settings.webrtc.account.selected, selected)
                }

                if (this.v) this.v.$touch()
            },
            /**
            * Preselect the first available account when WebRTC is switched on.
            * A similar background watcher handles resetting the account when
            * WebRTC is turned off.
            * @param {Object} enabled - New checkbox/switch value.
            */
            'settings.webrtc.toggle': function(enabled) {
                if (enabled && this.settings.webrtc.account.options.length) {
                    const selected = app.utils.copyObject(this.settings.webrtc.account.options[0])
                    Object.assign(app.state.settings.webrtc.account.selected, selected)
                }

                if (this.v) this.v.$touch()
            },
        },
    }

    return AccountPicker
}
