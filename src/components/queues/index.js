module.exports = (app) => {

    return {
        computed: app.helpers.sharedComputed(),
        methods: Object.assign({
            classesQueue: function(queue) {
                let classes = {}
                if (queue.queue_size <= 3) classes.quiet = true
                else if (queue.queue_size <= 6) classes.moderate = true
                else if (queue.queue_size <= 10) classes.busy = true
                else if (queue.queue_size > 10) classes.hectic = true
                return classes
            },
            toggleActiveQueue: function(queue) {
                if (app.state.queues.selected.id !== queue.id) {
                    app.emit('bg:queues:selected', {queue: queue})
                } else {
                    app.emit('bg:queues:selected', {queue: null})
                }
            },
        }, app.helpers.sharedMethods()),
        render: templates.queues.r,
        staticRenderFns: templates.queues.s,
        store: {
            queues: 'queues.queues',
            selected: 'queues.selected',
            state: 'queues.state',
            user: 'user',
        },
    }
}
