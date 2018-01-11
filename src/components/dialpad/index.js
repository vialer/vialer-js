module.exports = (app) => {
    const dtmfTone = new app.sounds.DtmfTone(350, 440)
    const allowedKeys = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '#']

    // we detect the mouseup event on the window tag as opposed to the li
    // tag because otherwise if we release the mouse when not over a button,
    // the tone will remain playing
    $(window).on('mouseup touchend', function(){
        if (dtmfTone.status) {
            dtmfTone.stop()
        }
    })

    return {
        methods: {
            dialNumber: function() {
                app.emit('dialer:dial', {
                    analytics: 'Dialpad',
                    b_number: this.module.dialNumber,
                    forceSilent: false,
                })
            },
            login: function() {
                app.emit('user:login.attempt', {
                    password: this.user.password,
                    username: this.user.email,
                })
            },
            playDtmf: function(key, e) {
                if (e) {
                    if (!allowedKeys.includes(e.key)) return
                    key = e.key
                } else {
                    this.module.dialNumber = `${this.module.dialNumber}${key}`
                }
                dtmfTone.playKey(key)

            },
            removeLastNumber: function() {
                this.module.dialNumber = this.module.dialNumber.substring(0, this.module.dialNumber.length - 1)
            },
            stopDtmf: function() {
                dtmfTone.stop()
            },
        },
        render: templates.dialpad.r,
        staticRenderFns: templates.dialpad.s,
        store: {
            module: 'dialpad',
        },
        watch: {
            'module.dialNumber': function(newVal, oldVal) {
                if (isNaN(newVal)) {
                    this.module.dialNumber = oldVal
                }
            },
        },
    }
}
