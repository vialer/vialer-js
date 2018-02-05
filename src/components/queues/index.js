module.exports = (app) => {

    return {
        computed: app.utils.sharedComputed(),
        methods: Object.assign({
            toggleActiveQueue: function(queue) {
                if (app.state.queues.selected.id !== queue.id) {
                    app.emit('bg:queues:selected', {queue: queue})
                } else {
                    app.emit('bg:queues:selected', {queue: null})
                }
            },
        }, app.utils.sharedMethods()),
        render: templates.queues.r,
        staticRenderFns: templates.queues.s,
        store: {
            queues: 'queues.queues',
            selected: 'queues.selected',
        },
    }
}
