module.exports = (app) => {

    return {
        computed: app.utils.sharedComputed(),
        methods: {
            classes: function(call, block) {
                let classes = {}
                if (block === 'icon') {
                    classes.active = call.active
                    if (call.hold) classes['icon-on-hold'] = true
                    else classes['icon-phone'] = true
                }
                return classes
            },
            setActiveCall: function(call) {
                app.emit('bg:sip:call_activate', {
                    callId: call.id,
                    holdInactive: false,
                    unholdActive: false,
                })
            },
        },
        render: templates.callswitcher.r,
        staticRenderFns: templates.callswitcher.s,
        store: {
            calls: 'calls.calls',
        },
    }
}
