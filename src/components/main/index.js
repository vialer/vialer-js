module.exports = (app) => {
    console.log(app.utils.sharedComputed())
    return {
        computed: app.utils.sharedComputed(),
        render: templates.main.r,
        staticRenderFns: templates.main.s,
        store: app.state,
    }
}
