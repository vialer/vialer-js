module.exports = (app) => {

    return {
        computed: app.utils.sharedComputed(),
        props: ['call'],
        render: templates.callbar.r,
        staticRenderFns: templates.callbar.s,
        store: {},
    }
}
