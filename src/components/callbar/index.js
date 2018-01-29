module.exports = (app) => {

    return {
        computed: app.utils.sharedComputed(),
        methods: {

        },
        props: ['call'],
        render: templates.callbar.r,
        staticRenderFns: templates.callbar.s,
        store: {
            env: 'env',
            sip: 'sip',
            user: 'user',
        },
    }
}
