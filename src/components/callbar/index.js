module.exports = (app) => {

    return {
        computed: app.utils.sharedComputed(),
        methods: {

        },
        render: templates.callbar.r,
        staticRenderFns: templates.callbar.s,
        store: {
            env: 'env',
            sip: 'sip',
            user: 'user',
        },
    }
}
