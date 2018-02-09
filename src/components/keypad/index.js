module.exports = (app) => {
    const keyTone = new app.sounds.DtmfTone()
    const allowedKeys = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '#']

    /**
    * Clear a number of special characters.
    * @param {String} number - Number to clean.
    * @returns {String} - The cleaned number.
    */
    function sanitizeNumber(number) {
        number = String(number).replace(/[^\d|!+|!*|!#]/g, '')
        return number
    }

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
        computed: {
            matchedContact: function() {
                let _number = String(this.number)
                let matchedContact = null

                if (_number.length > 1) {
                    for (const id of Object.keys(this.contacts)) {
                        const contact = this.contacts[id]
                        const number = String(contact.number)
                        if (number.includes(_number)) {
                            matchedContact = contact
                        }
                    }
                }
                return matchedContact
            },
        },
        methods: Object.assign({
            callStart: function(createCall = false) {
                if (!this.number) return
                // Only create a new call when the keypad is used without existing call.
                if (createCall) app.emit('bg:calls:call_create', {number: this.number, start: true})
                else {
                    // Using an empty call object. The keypad number is used,
                    // so set the call's number before sending over the call
                    // state.
                    this.call.number = this.number
                    let transferState = JSON.parse(JSON.stringify(this.call))
                    app.emit('bg:calls:call_start', transferState)
                }
            },
            classes: function(block) {
                let classes = {}
                if (block === 'number-input') {
                    classes['number-input'] = true
                    classes[this.display] = true
                }
                return classes
            },
            inputChange: function(newVal) {
                this.$emit('update:model', newVal)
            },
            pressKey: function(key) {
                if (!allowedKeys.includes(key)) {
                    return
                }
                keyTone.play(key)
                let newVal = sanitizeNumber(`${this.number}${key}`)
                if (newVal) this.$emit('update:model', newVal)
                if (this.mode === 'dtmf') app.emit('bg:calls:dtmf', {callId: this.call.id, key})
            },
            removeLastNumber: function() {
                if (this.number) this.$emit('update:model', this.number.substring(0, this.number.length - 1))
            },
            unpressKey: function() {
                window.setTimeout(() => {
                    keyTone.stop()
                }, 50)
            },
        }, app.utils.sharedMethods()),
        props: {
            call: {default: null},
            display: {
                default: 'expanded',
                type: String,
            },
            dtmf: {
                default: false,
                type: Boolean,
            },
            mode: {
                default: 'call',
                type: String,
            },
            number: {
                default: '',
                type: String,
            },
            search: {
                default: true,
                type: Boolean,
            },
        },
        render: templates.keypad.r,
        staticRenderFns: templates.keypad.s,
        store: {
            contacts: 'contacts.contacts',
        },
        watch: {
            number: function(newVal, oldVal) {
                let cleanedNumber = sanitizeNumber(newVal)
                this.$emit('update:model', cleanedNumber)
            },
        },
    }
}
