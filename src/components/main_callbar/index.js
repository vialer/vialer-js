module.exports = (app) => {
    /**
    * @memberof fg.components
    */
    const MainCallbar = {
        computed: app.helpers.sharedComputed(),
        props: ['call'],
        render: templates.main_callbar.r,
        staticRenderFns: templates.main_callbar.s,
        store: {},
    }

    return MainCallbar
}
