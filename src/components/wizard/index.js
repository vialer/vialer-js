module.exports = (app) => {
    // Initialize sub-components of the wizard.
    Vue.component('StepMicPermission', require('./components/step_mic_permission')(app))
    Vue.component('StepTelemetry', require('./components/step_telemetry')(app))
    Vue.component('StepVoipaccount', require('./components/step_voipaccount')(app))
    Vue.component('StepWelcome', require('./components/step_welcome')(app))
    /**
    * @memberof fg.components
    */
    const Wizard = {
        computed: app.helpers.sharedComputed(),
        data: function() {
            return {
                steps: [
                    {name: 'welcome', ready: true},
                    {name: 'telemetry', ready: null}, // hide the next button.
                    {name: 'voipaccount', ready: false},
                    {name: 'microphone', ready: null},
                ],
            }
        },
        methods: Object.assign({
            finish: function() {
                app.setState({settings: {wizard: {completed: true, step: 0}}}, {persist: true})
                app.emit('bg:calls:disconnect', {reconnect: true})
                this.$notify({icon: 'settings', message: this.$t('Almost done! Please check your audio settings.'), timeout: 0, type: 'success'})
            },
            nextStep: function() {
                if (this.steps[this.step].name === 'voipaccount') {
                    this.settings.webrtc.enabled = true
                    app.setState({
                        settings: {
                            webrtc: {
                                account: {
                                    selected: this.settings.webrtc.account.selected,
                                },
                                enabled: true,
                            },
                        },
                    }, {persist: true})
                }
                app.setState({settings: {wizard: {step: this.step += 1}}}, {persist: true})
            },
        }, app.helpers.sharedMethods()),
        /**
        * Adjusting the wizard steps is done when the component
        * mounts, and when data changes. That is being tracked
        * in appropriate watchers.
        */
        mounted: function() {
            // The microphone step is ready when the permission
            // is already there.
            if (this.settings.webrtc.media.permission) {
                this.steps.find((i) => i.name === 'microphone').ready = true
            }
            const selectedVoipaccountId = this.settings.webrtc.account.selected.id
            const voipaccountStep = this.steps.find((i) => i.name === 'voipaccount')
            voipaccountStep.ready = (this.validVoipSettings && selectedVoipaccountId) ? true : false
        },
        render: templates.wizard.r,
        staticRenderFns: templates.wizard.s,
        store: {
            app: 'app',
            permission: 'settings.webrtc.media.permission',
            settings: 'settings',
            step: 'settings.wizard.step',
        },
        watch: {
            permission: function(newPermission) {
                if (this.settings.webrtc.media.permission) {
                    this.steps.find((i) => i.name === 'microphone').ready = true
                }
            },
            /**
            * The `voipaccount` step can only be passed when a VoIP account is selected.
            * @param {String} selectedVoipaccountId - The VoIP account that is being selected.
            */
            'settings.webrtc.account.selected.id': function(selectedVoipaccountId) {
                const voipaccountStep = this.steps.find((i) => i.name === 'voipaccount')
                voipaccountStep.ready = (this.validVoipSettings && selectedVoipaccountId) ? true : false
            },
        },
    }

    return Wizard
}
