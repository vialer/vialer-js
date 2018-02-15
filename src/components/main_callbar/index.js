module.exports = (app) => {

    return {
        computed: app.helpers.sharedComputed(),
        props: ['call'],
        render: templates.main_callbar.r,
        staticRenderFns: templates.main_callbar.s,
        store: {},
    }
}
