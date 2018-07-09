module.exports = (app, shared) => {
    /**
    * @memberof fg.components
    */
    const WizardMicPermission = {
        computed: Object.assign({
            stepValid: function() {
                return this.permission
            },
        }, app.helpers.sharedComputed()),
        methods: Object.assign({
            queryDevices: function() {
                app.emit('bg:devices:verify-sinks', {callback: () => {
                    this.stepNext()
                }})
            },
        }, shared().methods),
        render: templates.wizard_mic_permission.r,
        staticRenderFns: templates.wizard_mic_permission.s,
        store: {
            app: 'app',
            options: 'settings.wizard.steps.options',
            permission: 'settings.webrtc.media.permission',
            selected: 'settings.wizard.steps.selected',
        },
    }

    return WizardMicPermission
}
