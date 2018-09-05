module.exports = (app) => {
    /**
    * @memberof fg.components
    */
    const AccountPicker = {
        computed: Object.assign({
            validationField: function() {
                if (this.account.status === 'loading') return null
                return this.v.settings.webrtc.account.selected.id
            },
        }, app.helpers.sharedComputed()),
        methods: Object.assign({
            refreshAccounts: function() {
                // Call the API endpoint responsible for updating the account list.
                app.emit('bg:availability:platform_data')
            },
        }, app.helpers.sharedMethods()),
        mounted: function() {
            if (this.account.status === 'loading') {
                // Still loading; the account status watcher will trigger validation.
                this._holdFirstValidation = true
            } else {
                // Accounts list ready. Reset validation.
                this.v.$reset()
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
            account: 'settings.webrtc.account',
            settings: 'settings',
            toggle: 'settings.webrtc.toggle',
        },
        watch: {
            /**
            * Always update the selected option from the updated
            * option list from provider, because an account may
            * have received different properties.
            * @param {Array} options - Reactive array with VoIP account options.
            */
            'account.options': function(options) {
                if (this.account.selected.id && options.length) {
                    const match = options.find((i) => i.id === this.account.selected.id)
                    if (match) Object.assign(this.account.selected, app.utils.copyObject(match))
                }

                this.v.$touch()
            },
            /**
            * Prevent validation from kicking in while the account items
            * are still being loaded when this component is already mounted.
            * This happens when the user is clicking fast through to the
            * wizard account selection or when the account API call takes
            * takes a bit long.
            * @param {String|null} newStatus - Account loader status.
            */
            'account.status': function(newStatus) {
                if (this._holdFirstValidation && !newStatus) {
                    this.v.$reset()
                    this._holdFirstValidation = false
                }
            },
        },
    }

    return AccountPicker
}
