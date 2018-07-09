module.exports = (app, shared) => {
    /**
    * @memberof fg.components
    */
    const WizardDevices = {
        beforeMount: function() {
            if (!this.devices.input.length || !this.devices.output.length) {
                app.emit('bg:devices:verify-sinks')
            }
        },
        computed: Object.assign({
            stepValid: function() {
                return this.permission
            },
        }, app.helpers.sharedComputed()),

        methods: Object.assign({
            storeDevices: function() {
                let devices = app.utils.copyObject(this.devices)
                // Persist the the device data.
                app.setState({settings: {webrtc: {devices}}}, {persist: true})
                this.finishWizard()
            },
        }, shared().methods),
        render: templates.wizard_devices.r,
        staticRenderFns: templates.wizard_devices.s,
        store: {
            app: 'app',
            devices: 'settings.webrtc.devices',
            options: 'settings.wizard.steps.options',
            permission: 'settings.webrtc.media.permission',
            selected: 'settings.wizard.steps.selected',
        },

    }

    return WizardDevices
}
