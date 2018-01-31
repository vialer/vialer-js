module.exports = (app) => {

    return {
        computed: app.utils.sharedComputed(),
        methods: Object.assign({
            activateQueue: function(queue) {
                this.module.selectedQueue = queue.id
                app.emit('queues:queue.select', {id: queue.id})
            },
        }, app.utils.sharedMethods()),
        render: templates.queues.r,
        staticRenderFns: templates.queues.s,
        store: {
            module: 'queues',
        },
    }
}
