module.exports = (app) => {

    return {
        computed: app.utils.sharedComputed(),
        methods: Object.assign({
            toggleActiveQueue: function(queue) {
                if (app.state.queues.selected.id !== queue.id) {
                    app.setState({queues: {selected: {id: queue.id}}}, {persist: true})
                } else {
                    app.setState({queues: {selected: {id: null}}}, {persist: true})
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
