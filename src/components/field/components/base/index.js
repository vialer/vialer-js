module.exports = (app) => {
    const BaseField = {
        props: {
            autofocus: Boolean,
            change: Function,
            click: Function,
            css: '',
            disabled: Boolean,
            help: String,
            label: String,
            name: '',
            validation: Object,
        },
        computed: {
            /**
             * Validation flag being used to conditionally render
             * validation-helper styling.
             * @returns {Boolean} - Whether the field is valid or not.
             */
            invalidFieldValue: function() {
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
            /**
             * Match a validation error with a (translated) error message.
             * @returns {Array} - An array of translated error messages.
             */
            validationMessage: function() {
                let err = []
                const v = this.validation

                if (!v) return err

                if (v.customValid === false) {
                    err.push(this.$t(v.$params.customValid.message).capitalize())
                }

                if (v.domain === false) {
                    err.push(this.$t('fill in a valid domain.').capitalize())
                }

                if (v.email === false) {
                    err.push(this.$t('fill in a valid email address.').capitalize())
                }

                if (v.maxLength === false) {
                    err.push(this.$t(
                        'fill in a value no longer than {max} characters.', {
                            max: v.$params.maxLength.max,
                        }).capitalize()
                    )
                }

                if (v.minLength === false) {
                    err.push(this.$t(
                        'fill in a value of at least {min} characters.', {
                            min: v.$params.minLength.min,
                        }).capitalize()
                    )
                }

                if (v.numeric === false) {
                    err.push(this.$t('fill in a valid number.').capitalize())
                }

                if (v.must_be_unique === false) {
                    err.push(this.$t('fill in a unique value.').capitalize())
                }

                if (v.required === false) {
                    err.push(this.$t('this field is required.').capitalize())
                }

                if (v.requiredIf === false) {
                    err.push(this.$t('this field is required.').capitalize())
                }

                if (v.sameAs === false) {
                    err.push(this.$t('field "{fieldName}" must have the same value.', {
                        fieldName: v.$params.sameAs.eq,
                    }).capitalize())
                }

                if (v.url === false) {
                    err.push(this.$t('fill in a valid url.').capitalize())
                }

                return err.join('</br>')
            },
        },
        methods: {
            classes: function(block) {
                let classes = {}
                if (block === 'input') {
                    classes.input = true
                    if (this.invalidFieldValue) classes['is-danger'] = true
                } else if (block === 'select') {
                    classes.select = true
                    classes['has-button'] = this.hasButton
                    if (this.invalidFieldValue) classes['is-danger'] = true
                } else if (block === 'select-search') {
                    classes['has-button'] = this.hasButton
                    classes['select-search'] = true
                } else if (block === 'label') {
                    // Field has no validation at all.
                    if (this.validation) {
                        if (this.validation.required === false || this.validation.required === true) {
                            classes.required = true
                        }
                    }
                }

                return classes
            },
        },
        render: templates.field_base.r,
        staticRenderFns: templates.field_base.s,
    }

    return BaseField
}
