module.exports = (app, actions) => {

    return {
        computed: {
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

                if (newVal === 'yes') {
                    [selectedType, selectedId] = this.module.destinations.selected.split('-')
                }

                app.emit('availability.update', {id: selectedId, type: selectedType})
            },
            'module.destinations.selected': function(newVal, oldVal) {
                let [selectedType, selectedId] = this.module.destinations.selected.split('-')
                app.emit('availability.update', {id: selectedId, type: selectedType})
            },
        },
    }
}
