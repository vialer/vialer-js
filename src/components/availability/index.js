module.exports = (app, actions) => {

    return {
        methods: app.utils.sharedMethods(),
        render: templates.availability.r,
        staticRenderFns: templates.availability.s,
        store: {
            available: 'availability.available',
            destinations: 'availability.destinations',
            dnd: 'availability.dnd',
            placeholder: 'availability.placeholder',
            selected: 'availability.selected',
            user: 'user',
            vendor: 'vendor',
            webrtc: 'settings.webrtc',
        },
        watch: {
            available: function(newVal, oldVal) {
                // Sending an empty object like this will unset the
                // user's availability.
                let selected

                if (!this.placeholder.id) selected = {id: null, name: null, type: null}
                else selected = this.placeholder

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
