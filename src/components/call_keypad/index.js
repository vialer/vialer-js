module.exports = (app) => {

    const allowedKeys = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '#']

    // we detect the mouseup event on the window tag as opposed to the li
    // tag because otherwise if we release the mouse when not over a button,
    // the tone will remain playing.
    function stopKeypress() {
        if (app.sounds.dtmfTone.status) {
            window.setTimeout(() => {
                app.sounds.dtmfTone.stop()
            }, 50)
        }
    }

    document.addEventListener('mouseup', stopKeypress)
    document.addEventListener('touchend', stopKeypress)

    /**
    * @memberof fg.components
    */
    const CallKeypad = {
        computed: Object.assign({
            matchedContact: function() {
                let _number = String(this.number)
                if (_number.length > 1) {
                    let match = app.helpers.matchContact(String(this.number), true)
                    if (match) {
                        return {
                            contact: this.contacts[match.contact],
                            endpoint: this.contacts[match.contact].endpoints[match.endpoint],
                        }
                    }
                }
                return null
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
                if (this.callingDisabled) return
                if (!key) {
                    // No key pressed. Stop playing sound.
                    window.setTimeout(() => app.sounds.dtmfTone.stop(), 50)
                    return
                }
                if (!allowedKeys.includes(key)) return
                app.sounds.dtmfTone.play(key)
                // Force stop playing dtmf sound after x amount of time,
                // because mouseup event may not fire properly, in case of
                // a right-click => contextmenu.
                window.setTimeout(() => app.sounds.dtmfTone.stop(), 500)
                let newVal = app.utils.sanitizeNumber(`${this.number}${key}`)
                if (newVal) this.$emit('update:model', newVal)
                if (this.mode === 'dtmf') app.emit('bg:calls:dtmf', {callId: this.call.id, key})
            },
            removeLastNumber: function() {
                if (this.callingDisabled) return
                if (this.number) this.$emit('update:model', this.number.substring(0, this.number.length - 1))
            },
        }, app.helpers.sharedMethods()),
        mounted: function() {
            // Focus the input element directly.
            if (!this.callingDisabled) {
                this.$refs.input.focus()
            }
        },
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
            number: function(newNumber) {
                // Toggle developer features with a special number.
                if (newNumber === '02*06*18') {
                    if (!this.user.developer) {
                        this.$notify({icon: 'info', message: this.$t('Developer mode activated'), type: 'success'})
                    } else {
                        this.$notify({icon: 'info', message: this.$t('Developer mode deactivated'), type: 'success'})
                    }
                    app.setState({user: {developer: !this.user.developer}}, {persist: true})
                }
                if (this.callingDisabled) return
                let cleanedNumber = app.utils.sanitizeNumber(newNumber)
                this.$emit('update:model', cleanedNumber)
            },
        },
    }

    return CallKeypad
}
