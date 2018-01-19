module.exports = (app, actions) => {

    return {
        methods: {
            activateQueue: function(queue) {
                this.module.selectedQueue = queue.id
                app.emit('queues:queue.select', {id: queue.id})
            },
        },
        render: templates.queues.r,
        staticRenderFns: templates.queues.s,
        store: {
            module: 'queues',
        },
    }
}
