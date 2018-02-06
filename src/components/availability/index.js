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
                let newDestination = {id: null, name: null, type: null}
                if (newVal === 'yes') {
                    newDestination = this.placeholder
                }
                app.emit('bg:update-availability', {
                    destinations: this.destinations,
                    selected: newDestination,
                })

            },
            selected: function(newVal, oldVal) {
                this.placeholder = {id: this.selected.id, name: this.selected.name}
                app.emit('bg:update-availability', {
                    destinations: this.destinations,
                    selected: this.selected,
                })
            },
        },
    }
}
