module.exports = (app) => {
    const template = templates.field

    /**
     * @memberof module:general
     * @namespace
     */
    return {
        computed: {
            /**
             * Match a validation error with a (translated) error message.
             * @returns {Array} - An array of translated error messages.
             */
            validationMessage: function() {
                let errorMessages = []
                if (this.validation.required === false) {
                    errorMessages.push(this.$t('This field is required.'))
                }
                if (this.validation.requiredIf === false) {
                    errorMessages.push(this.$t('This field is required.'))
                }

                if (this.validation.minLength === false) {
                    errorMessages.push(this.$t(
                        'Please fill in a value of at least {min} characters.', {
                            min: this.validation.$params.minLength.min,
                        })
                    )
                }
                if (this.validation.maxLength === false) {
                    errorMessages.push(this.$t(
                        'Please fill in a value no longer than {max} characters.', {
                            max: this.validation.$params.maxLength.max,
                        })
                    )
                }

                if (this.validation.domain === false) {
                    errorMessages.push(this.$t('Please fill in a valid domain.'))
                }
                if (this.validation.email === false) {
                    errorMessages.push(this.$t('Please fill in a valid email address.'))
                }
                if (this.validation.url === false) {
                    errorMessages.push(this.$t('Please fill in a valid url.'))
                }
                if (this.validation.must_be_unique === false) {
                    errorMessages.push(this.$t('Please fill in a unique value.'))
                }
                if (this.validation.sameAs === false) {
                    errorMessages.push(this.$t('Field "{fieldName}" must have the same value.', {
                        fieldName: this.validation.$params.sameAs.eq,
                    }))
                }

                return errorMessages.join('</br>')
            },
            vmodel: function() {
                return this.model
            },
        },
        methods: {
            classes: function(block) {
                let classes = {}
                const invalid = this.vInvalid()
                if (block === 'input') {
                    classes.input = true
                    if (invalid) classes['is-danger'] = true
                    else if (invalid === false) classes['is-success'] = true
                } else if (block === 'select') {
                    classes.select = true
                    if (invalid) classes['is-danger'] = true
                    else if (invalid === false) classes['is-success'] = true
                }

                return classes
            },
            onChange: function(event) {
                if (!this.change) return
                this.change(event)
            },
            /**
            * Emit the child component's state back to it's
            * defining parent. The value is captured using `:model.sync`.
            * @param {Event} event - The original change event from the input.
            * @param {String} value - The value before the change happened.
            * @param {Array} options - Options when its a select.
            */
            vChange: function(event, value, options) {
                // Toggles value of a checkbox.
                if (event.target.type === 'checkbox') {
                    this.$emit('update:model', event.target.checked)
                } else if (['password', 'text'].includes(event.target.type)) {
                    this.$emit('update:model', event.target.value)
                } else if (event.target.tagName === 'SELECT') {
                    // A multiselect.
                    if (event.target.multiple) {
                        let selectedOptions = Array.prototype.filter.apply(event.target.options, [(i) => i.selected])
                        // Note that the value is parsed to a Number. Selected
                        // state fails without casting to the proper type.
                        value = selectedOptions.map((o) => parseInt(o.value))
                    }

                    if (!value) {
                        // Handle syncing an empty option to the model.
                        let emptyOption = {id: null, name: null}
                        // Use the first option to determine additional keys.
                        if (options.length) for (let key of Object.keys(options[0])) emptyOption[key] = null
                        this.$emit('update:model', emptyOption)
                    } else {
                        for (const option of options) {
                            if (String(option.id) === String(value)) {
                                this.$emit('update:model', option)
                            }
                        }
                    }
                }

                if (this.validation) this.validation.$touch()
            },
            /**
            * Handles executing a referenced click function from
            * a parent component.
            * @param {Event} event - The original change event from the input.
            */
            vClick: function(event) {
                if (!this.click) return
                this.click(event)
            },
            /**
             * Validation flag being used to conditionally render
             * validation-helper styling.
             * @returns {Boolean} - Whether the field is valid or not.
             */
            vInvalid: function() {
                if (!this.validation) return null
                if (!this.validation.$dirty) return null
                // Validation for `requiredIf` depends on the state of other
                // fields. Therefor don't use the $dirty check on this field,
                // but go straight for the $invalid state.
                if ('requiredIf' in this.validation) {
                    return this.validation.$invalid
                }
                // Invalid has 3 states: true, false and null (not changed/dirty).
                return this.validation.$error
            },
            vRequired: function() {
                // Field has no validation at all.
                if (!this.validation) return false
                return this.validation.required === false || this.validation.required === true
            },
        },
        props: {
            autofocus: Boolean,
            change: Function,
            click: Function,
            disabled: Boolean,
            help: String,
            idfield: {
                default: 'id',
            },
            label: String,
            model: '',
            name: '',
            options: Array,
            placeholder: String,
            type: String,
            validation: Object,
        },
        render: template.r,
        staticRenderFns: template.s,
    }
}
