module.exports = (app) => {

    return {
        computed: app.utils.sharedComputed(),
        render: templates.main.r,
        staticRenderFns: templates.main.s,
        store: app.state,
    }
}
