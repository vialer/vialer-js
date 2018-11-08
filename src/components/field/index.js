module.exports = (app) => {
    /**
    * @memberof fg.components
    */
    const Field = {
        computed: {
            filteredOptions: function(event) {
                let filteredOptions = []

                for (const option of this.options) {
                    // Case insensitive search.
                    if (option.name.toLowerCase().includes(this.searchQuery.toLowerCase())) {
                        filteredOptions.push(option)
                    }
                }
                return filteredOptions
            },
            hasButton: function() {
                if (!this.$slots['select-extra']) return false
                return Boolean(this.$slots['select-extra'].length)
            },
            /**
             * Validation flag being used to conditionally render
             * validation-helper styling.
             * @returns {Boolean} - Whether the field is valid or not.
             */
            invalidFieldValue: function() {
                return this.validationMessage !== ''
            },
            /**
             * Match a validation error with a (translated) error message.
             * @returns {Array} - An array of translated error messages.
             */
            validationMessage: function() {
                let err = []
                const v = this.validation

                if (this.fresh || !v) return ''

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
        data: function() {
            let data = {
                fresh: true,
            }

            if (this.type === 'password') {
                data.visible = false
            }

            if (this.type === 'select-search') {
                // Input value that is used to filter the options with.
                data.searchQuery = ''
                // Placeholder on the input that marks the current selected item.
                data.searchPlaceholder = ''
                // Toggle search filter options.
                data.searchVisible = false
                // The item that is going to be selected (not the actual model).
                data.searchSelected = this.model
            }
            return data
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
            /**
            * This is the default value for a select that has no options.
            * @returns {Object} - An empty select option.
            */
            emptySelectOption: function() {
                // Handle syncing an empty option to the model.
                let emptyOption = {id: null, name: null}
                // Use the first option to determine additional keys.
                if (this.options.length) {
                    for (let key of Object.keys(this.options[0])) {
                        emptyOption[key] = null
                    }
                }
                return emptyOption
            },
            searchSelect(event, option, keyModifier, updateModel) {
                let selectedOption = null
                if (option) {
                    // Option click select.
                    selectedOption = option
                } else if (keyModifier) {
                    // Navigational select.
                    if (keyModifier === 'enter') {
                        if (!this.searchSelected.id) selectedOption = this.filteredOptions[0]
                        else {
                            selectedOption = this.searchSelected
                        }
                    } else if (['up', 'down', 'page-down', 'page-up'].includes(keyModifier)) {
                        if (!this.searchSelected.id) selectedOption = this.filteredOptions[0]
                        else {
                            const itemIndex = this.filteredOptions.findIndex((i) => i.id === this.searchSelected.id)
                            if (keyModifier === 'down' && this.filteredOptions.length > itemIndex) {
                                selectedOption = this.filteredOptions[itemIndex + 1]
                            } else if (keyModifier === 'up' && itemIndex > 0) {
                                selectedOption = this.filteredOptions[itemIndex - 1]
                            } else if (keyModifier === 'page-down') {
                                if (this.filteredOptions.length >= itemIndex + 5) {
                                    selectedOption = this.filteredOptions[itemIndex + 5]
                                }
                            } else if (keyModifier === 'page-up') {
                                if (this.filteredOptions.length >= itemIndex - 5 && (itemIndex - 5) >= 0) {
                                    selectedOption = this.filteredOptions[itemIndex - 5]
                                }
                            }
                        }
                    } else if (keyModifier === 'query') {
                        selectedOption = this.filteredOptions[0]
                    }
                } else {
                    // Click/focus.
                    if (!this.searchSelected.id) selectedOption = this.filteredOptions[0]
                    else selectedOption = this.searchSelected
                }

                if (selectedOption) {
                    this.searchSelected = selectedOption
                    if (updateModel) {
                        this.searchQuery = ''
                        this.searchVisible = false
                        this.searchPlaceholder = selectedOption.name
                        this.$emit('update:model', selectedOption)
                    } else {
                        this.searchVisible = true
                    }
                }
            },
            searchToggle(event, el, visible) {
                this.searchVisible = visible
            },
            /**
            * Toggles visibility flag on a password field.
            */
            toggleVisible() {
                this.visible = !this.visible
            },
            /**
            * Emit the child component's state back to it's
            * parent component. The parent container captures the value
            * using `:model.sync` instead of `v-model`.
            * @param {Event} event - The original browser event that triggered the change.
            */
            updateModel: function(event) {
                this.fresh = false
                let value = event.target.value
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
                        this.$emit('update:model', this.emptySelectOption())
                    } else {
                        for (const option of this.options) {
                            if (String(option.id) === String(value)) {
                                // Do not pass a reference or you may end up
                                // in a situation that changing a field's
                                // selected option, also changes the item in
                                // the options Array.
                                this.$emit('update:model', app.utils.copyObject(option))
                            }
                        }
                    }
                } else if (event.target.tagName === 'TEXTAREA') {
                    // For now assume each line is an item in an Array, because
                    // it suits the usecases for the blacklist items. Extend
                    // when other usecases (plain text) are required.
                    let items = event.target.value.split('\n')
                    this.$emit('update:model', items)
                }

                if (this.validation) this.validation.$touch()
            },
        },
        mounted: function() {
            if (this.type === 'select') {
                // There are no options which means there won't be a filled
                // model value. Force an update here, because the model value
                // may still be cached from the store.
                if (!this.options.length) {
                    this.$emit('update:model', this.emptySelectOption())
                }
            }
        },
        props: {
            autofocus: Boolean,
            change: Function,
            click: Function,
            css: '',
            disabled: Boolean,
            empty: {
                default: app.$t('no options available'),
                type: String,
            },
            help: String,
            idfield: {
                default: 'id',
            },
            label: String,
            model: null,
            name: '',
            options: Array,
            placeholder: String,
            type: String,
            validation: Object,
        },
        render: templates.field.r,
        staticRenderFns: templates.field.s,
        updated: function() {
            if (this.type === 'select-search') {
                // Keep the scroll position centered on the selected option.
                let $ = {widget: this.$refs.widget}
                if (!$.widget) return

                $.input = this.$refs.input
                $.options = this.$refs.options
                $.selectedOption = $.widget.querySelector(`#option-${this.searchSelected.id}`)
                if ($.selectedOption) {
                    $.options.scrollTop = $.selectedOption.offsetTop - $.input.offsetHeight - $.selectedOption.offsetHeight
                }
            }
        },
    }

    return Field
}
