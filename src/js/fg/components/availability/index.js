module.exports = (app, actions) => {

    return {
        computed: {
            selectedDestination: function() {
                let userdestination = this.module.userdestination
                let selectedFixeddestination = userdestination.selecteduserdestination.fixeddestination
                let selectedPhoneaccount = userdestination.selecteduserdestination.phoneaccount
                if (selectedFixeddestination) return `fixeddestination-${selectedFixeddestination}`
                if (selectedPhoneaccount) return `phoneaccount-${selectedPhoneaccount}`
                return false
            },
            widgetState: function() {
                let state = {
                    active: this.module.widget.active,
                    inactive: !this.module.widget.active,
                }

                state[this.module.widget.state] = true
                return state
            },
        },
        methods: {
            changeDestination: function(e) {
                let [type, id] = e.target.value.split('-')
                app.emit('availability.update', {id, type})
            },
            findSelectedDestination: function(option) {
                let userdestination = this.module.userdestination
                let selectedFixeddestination = userdestination.selecteduserdestination.fixeddestination
                let selectedPhoneaccount = userdestination.selecteduserdestination.phoneaccount
                // The option is a VoIP-account and the selected destination
                // is a phoneaccount.
                if (selectedPhoneaccount && option.account_id) {
                    return selectedPhoneaccount === parseInt(option.id)
                } else if (selectedFixeddestination && option.phonenumber) {
                    return selectedFixeddestination === parseInt(option.id)
                }

                return false
            },
            toggleActive: actions.toggleActive,
        },
        render: templates.availability.r,
        staticRenderFns: templates.availability.s,
        store: {
            module: 'availability',
        },
        watch: {
            'module.available': function(newVal, oldVal) {
                let selectedType = null
                let selectedId = null
                console.log("CHANGING AVAILABLE", newVal)

                if (newVal === 'yes') {
                    [selectedType, selectedId] = this.module.destinations.selected.split('-')
                }
                console.log("EMIT SOMETHING")
                app.emit('availability.update', {id: selectedId, type: selectedType})
            },
        },
    }
}
