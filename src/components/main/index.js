module.exports = (app) => {

    return {
        render: templates.main.r,
        staticRenderFns: templates.main.s,
        store: app.state,
    }
}
