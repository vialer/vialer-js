module.exports = (app) => {
    /**
    * @memberof fg.components
    */
    const MicPermission = {
        beforeDestroy: function() {
            clearInterval(this.intervalId)
        },
        computed: app.helpers.sharedComputed(),
        methods: Object.assign({}, app.helpers.sharedMethods()),
        props: {
            soundmeter: {default: true},
        },
        render: templates.mic_permission.r,
        staticRenderFns: templates.mic_permission.s,
        store: {
            app: 'app',
            devices: 'settings.webrtc.devices',
            env: 'env',
            permission: 'settings.webrtc.media.permission',
            settings: 'settings',
        },
    }

    return MicPermission
}
