module.exports = (app, actions) => {

    return {
        methods: app.utils.sharedMethods(),
        render: templates.availability.r,
        staticRenderFns: templates.availability.s,
        store: {
            available: 'availability.available',
            destinations: 'availability.destinations',
            placeholder: 'availability.placeholder',
            selected: 'availability.selected',
            user: 'user',
        },
        watch: {
            available: function(newVal, oldVal) {
                // Sending an empty object like this will unset the
                // user's availability.
                let newDestination = {id: null, name: null, type: null}
                if (newVal === 'yes') newDestination = this.placeholder
                // Only re-enable when there is a cached version of the
                // previous choice available.
                if (this.placeholder.id) {
                    app.emit('bg:availability:update', {
                        destinations: this.destinations,
                        selected: newDestination,
                    })
                }
            },
            selected: function(newVal, oldVal) {
                this.placeholder = {id: this.selected.id, name: this.selected.name, type: this.selected.type}
                app.emit('bg:availability:update', {
                    destinations: this.destinations,
                    selected: this.selected,
                })
            },
        },
    }
}
