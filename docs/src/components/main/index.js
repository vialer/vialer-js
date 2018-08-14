module.exports = (app) => {
    const Main = {
        render: templates.main.r,
        staticRenderFns: templates.main.s,
    }

    return Main
}
