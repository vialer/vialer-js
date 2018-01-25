module.exports = (app) => {
    const keyTone = new app.sounds.DtmfTone(350, 440)
    const allowedKeys = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, '*', '#']

    // we detect the mouseup event on the window tag as opposed to the li
    // tag because otherwise if we release the mouse when not over a button,
    // the tone will remain playing.
    $(window).on('mouseup touchend', function() {
        if (keyTone.status) {
            window.setTimeout(() => {
                keyTone.stop()
            }, 50)
        }
    })

    return {
        methods: {
            inputChange: function(newVal) {
                this.$emit('update:model', newVal)
            },
            pressKey: function(key) {
                if (!allowedKeys.includes(key)) return

                keyTone.play(key)
                this.$emit('update:model', `${this.number}${key}`)
                if (this.dtmf) {
                    app.emit('bg:sip:dtmf', {key})
                }
            },
            removeLastNumber: function() {
                this.$emit('update:model', this.number.substring(0, this.number.length - 1))
            },
            unpressKey: function() {
                window.setTimeout(() => {
                    keyTone.stop()
                }, 50)

            },
        },
        props: {
            dtmf: {
                default: false,
                type: Boolean,
            },
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
            number: function(newVal, oldVal) {
                if (isNaN(newVal)) {
                    this.$emit('update:model', oldVal)
                }
            },
        },
    }
}
