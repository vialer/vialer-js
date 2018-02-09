module.exports = (app) => {

    return {
        computed: app.utils.sharedComputed(),
        methods: Object.assign({
            classes: function(call, block) {
                let classes = {}
                if (block === 'call-button') {
                    classes.active = call.active
                    if (call.hold) classes['icon-on-hold'] = true
                    if (call.status === 'new') {
                        classes['new-call'] = true
                        // Show the close icon.
                        if (call.active) {
                            classes.fa = true
                            classes['fa-times'] = true
                        } else {
                            // Otherwise it is just a regular switch button.
                            classes['icon-phone'] = true
                        }
                    } else {
                        classes['icon-phone'] = true
                    }
                } else if (block === 'call-button-add') {
                    if (!call) call = this.getActiveCall()
                    if (!call) return classes
                    classes.active = (call.keypad.active && call.keypad.mode === 'call')
                }
                console.log('CLASSES:', classes)
                return classes
            },
            /**
            * A new call can only be created when there are no other
            * calls with the `new` status.
            * @returns {Boolean} - Whether it should be possible to create a new call.
            */
            newCallAvailable: function() {
                let available = true
                for (let callId of Object.keys(this.calls)) {
                    if (['new', 'create', 'invite'].includes(this.calls[callId].status)) {
                        available = false
                    }
                }
                return available
            },
            setActiveCall: function(call) {
                // Clicking on the new call tab while other call(s) is going on
                // and while it is already selected will trigger the new call
                // to be removed.
                if (Object.keys(this.calls).length > 1 && call.status === 'new' && call.active) {
                    app.emit('bg:calls:call_remove', {callId: call.id})
                } else {
                    // Otherwise it's just activated.
                    app.emit('bg:calls:call_activate', {
                        callId: call.id,
                        holdInactive: false,
                        unholdActive: false,
                    })
                }

            },
            toggleNewCall: function() {
                app.emit('bg:calls:call_create', {number: null, start: null})
            },
        }, app.utils.sharedMethods()),
        render: templates.callswitcher.r,
        staticRenderFns: templates.callswitcher.s,
        store: {
            calls: 'calls.calls',
        },
    }
}
