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
            activateQueue: function(queue) {
                this.module.selectedQueue = queue.id
                app.emit('queues:queue.select', {id: queue.id})
            },
            toggleActive: actions.toggleActive,
        },
        render: templates.queues.r,
        staticRenderFns: templates.queues.s,
        store: {
            module: 'queues',
        },
    }
}
