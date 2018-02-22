module.exports = (app) => {
    const keyTone = new app.sounds.DtmfTone()
    const allowedKeys = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '#']

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
        computed: Object.assign({
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
        }, app.helpers.sharedComputed()),
        methods: Object.assign({
            classes: function(block) {
                let classes = {}
                if (block === 'component') {
                    classes['call-ongoing'] = true
                } else if (block === 'number-input') {
                    classes['number-input'] = true
                    classes[this.display] = true
                }
                return classes
            },
            inputChange: function(newVal) {
                this.$emit('update:model', newVal)
            },
            pressKey: function(key) {
                if (this.callingDisabled || !allowedKeys.includes(key)) return
                keyTone.play(key)
                let newVal = app.utils.sanitizeNumber(`${this.number}${key}`)
                if (newVal) this.$emit('update:model', newVal)
                if (this.mode === 'dtmf') app.emit('bg:calls:dtmf', {callId: this.call.id, key})
            },
            removeLastNumber: function() {
                if (this.number) this.$emit('update:model', this.number.substring(0, this.number.length - 1))
            },
            unpressKey: function() {
                if (this.callingDisabled) return
                window.setTimeout(() => keyTone.stop(), 50)
            },
        }, app.helpers.sharedMethods()),
        props: {
            call: {default: null},
            display: {default: 'expanded', type: String},
            dtmf: {default: false, type: Boolean},
            mode: {default: 'call', type: String},
            number: {default: '', type: String},
            search: {default: true, type: Boolean},
        },
        render: templates.call_keypad.r,
        staticRenderFns: templates.call_keypad.s,
        store: {
            contacts: 'contacts.contacts',
            user: 'user',
        },
        watch: {
            number: function(newVal, oldVal) {
                // Toggle developer features with a special number.
                if (newVal === '02*06*18') {
                    if (!this.user.developer) {
                        this.$notify({icon: 'info', message: this.$t('Developer mode activated'), type: 'success'})
                    } else {
                        this.$notify({icon: 'info', message: this.$t('Developer mode deactivated'), type: 'success'})
                    }
                    app.setState({user: {developer: !this.user.developer}}, {persist: true})
                }
                if (this.callingDisabled) return
                let cleanedNumber = app.utils.sanitizeNumber(newVal)
                this.$emit('update:model', cleanedNumber)
            },
        },
    }
}
