module.exports = (app) => {
    const dtmfTone = new app.sounds.DtmfTone(350, 440)
    const allowedKeys = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '#']

    // we detect the mouseup event on the window tag as opposed to the li
    // tag because otherwise if we release the mouse when not over a button,
    // the tone will remain playing.
    $(window).on('mouseup touchend', function(){
        if (dtmfTone.status) {
            dtmfTone.stop()
        }
    })

    return {
        methods: {
            inputChange: function(newVal) {
                this.$emit('update:model', newVal)
            },
            pressKey: function(key, e) {
                if (e) {
                    if (!allowedKeys.includes(e.key)) return
                    key = e.key
                } else {
                    this.$emit('update:model', `${this.number}${key}`)
                }
                dtmfTone.playKey(key)
            },
            removeLastNumber: function() {
                this.$emit('update:model', this.number.substring(0, this.number.length - 1))
            },
            unpressKey: function() {
                dtmfTone.stop()
            },
        },
        props: {
            number: {
                default: '',
            },
        },
        render: templates.keypad.r,
        staticRenderFns: templates.keypad.s,
        store: {
            module: 'dialpad',
        },
        watch: {
            _number: function(newVal, oldVal) {
                if (isNaN(newVal)) {
                    this.$emit('update:model', oldVal)
                }
            },
        },
    }
}
