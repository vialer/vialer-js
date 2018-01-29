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
        data: function() {
            return {
                number: '',
            }
        },
        methods: {
            dial: function() {
                if (!this.number) return
                app.emit('bg:sip:call', {number: this.number})
            },
            inputChange: function(newVal) {
                this.$emit('update:model', newVal)
            },
            pressKey: function(key) {
                if (!allowedKeys.includes(key)) return
                keyTone.play(key)
                this.number = `${this.number}${key}`
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
            call: {default: null},
            dtmf: {
                default: false,
                type: Boolean,
            },
        },
        render: templates.keypad.r,
        staticRenderFns: templates.keypad.s,
        watch: {
            number: function(newVal, oldVal) {
                if (isNaN(newVal)) {
                    this.$emit('update:model', oldVal)
                }
            },
        },
    }
}
