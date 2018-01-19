module.exports = (app, actions) => {

    return {
        render: templates.availability.r,
        staticRenderFns: templates.availability.s,
        store: {
            available: 'availability.available',
            destination: 'availability.destination',
            destinations: 'availability.destinations',
            module: 'availability',
        },
        watch: {
            available: function(newVal, oldVal) {
                let newDestination = {id: null, name: null, type: null}
                if (newVal === 'yes') newDestination = this.destination

                this.destination = newDestination
                app.emit('bg:update-availability', {
                    destination: newDestination,
                    destinations: this.destinations,
                })
            },
            destination: function(newVal, oldVal) {
                app.emit('bg:update-availability', {
                    destination: this.destination,
                    destinations: this.destinations,
                })
            },
        },
    }
}
