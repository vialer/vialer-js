module.exports = (app, utils) => {

    return {
        render: templates.main.r,
        staticRenderFns: templates.main.s,
        store: app.state,
    }
}
