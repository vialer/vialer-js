module.exports = (app, actions) => {

    return {
        computed: app.helpers.sharedComputed(),
        methods: app.helpers.sharedMethods(),
        render: templates.availability.r,
        staticRenderFns: templates.availability.s,
        store: {
            available: 'availability.available',
            destinations: 'availability.destinations',
            dnd: 'availability.dnd',
            placeholder: 'availability.placeholder',
            selected: 'availability.selected',
            user: 'user',
            vendor: 'app.vendor',
            webrtc: 'settings.webrtc',
        },
        watch: {
            available: function(newVal, oldVal) {
                // Sending an empty object like this will unset the
                // user's availability.
                let selected
                const unavailable = {id: null, name: null, type: null}

                // User wants to be available.
                if (newVal) {
                    // Set from remembered account.
                    if (this.placeholder.id) selected = this.placeholder
                    // No remembered value; choose the first available option.
                    else if (this.destinations.length) selected = this.destinations[0]
                    // No choice; just set to unavailable.
                    else selected = unavailable
                } else {
                    // Availability is disabled. Set to unavailable.
                    selected = unavailable
                }

                app.emit('bg:availability:update', {
                    available: newVal,
                    destinations: this.destinations,
                    selected: selected,
                })
            },
            dnd: function(newVal, oldVal) {
                app.setState({availability: {dnd: newVal}}, {persist: true})
            },
            selected: function(newVal, oldVal) {
                // Save the user's last choice.
                // this.placeholder = {id: this.selected.id, name: this.selected.name, type: this.selected.type}
                app.emit('bg:availability:update', {
                    available: this.available,
                    destinations: this.destinations,
                    selected: this.selected,
                })
            },
        },
    }
}
