module.exports = (app) => {
    /**
    * @memberof fg.components
    */
    const MicPermission = {
        computed: app.helpers.sharedComputed(),
        methods: Object.assign({}, app.helpers.sharedMethods()),
        props: {
            soundmeter: {default: true},
        },
        render: templates.mic_permission.r,
        staticRenderFns: templates.mic_permission.s,
        store: {
            env: 'env',
            settings: 'settings',
        },
    }

    return MicPermission
}
