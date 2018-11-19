module.exports = (app) => {

    const BaseField = Vue.component('BaseField', require('../base')(app))

    /**
    * @memberof fg.components
    */
    const SelectField = {
        extends: BaseField,
        props: {
            empty: {
                default: app.$t('no options available'),
                type: String,
            },
            idfield: {
                default: 'id',
            },
            placeholder: String,
            value: null,
            options: Array,
        },
        data() {
            return {
                // Input value that is used to filter the options with.
                searchQuery: '',
                // Placeholder on the input that marks the current selected item.
                searchPlaceholder: '',
                // Toggle search filter options.
                searchVisible: false,
                // The item that is going to be selected (not the actual model).
                searchSelected: this.value,
            }
        },
        computed: {
            filteredOptions(event) {
                let filteredOptions = []

                for (const option of this.options) {
                    // Case insensitive search.
                    if (option.name.toLowerCase().includes(this.searchQuery.toLowerCase())) {
                        filteredOptions.push(option)
                    }
                }
                return filteredOptions
            },
        },
        methods: {
            /**
            * This is the default value for a select that has no options.
            * @returns {Object} - An empty select option.
            */
            emptySelectOption() {
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
                        this.$emit('input', app.utils.copyObject(selectedOption))
                    } else {
                        this.searchVisible = true
                    }
                }
            },

            searchToggle(event, el, visible) {
                this.searchVisible = visible
            },
        },
        mounted() {
            // There are no options which means there won't be a filled
            // model value. Force an update here, because the model value
            // may still be cached from the store.
            if (!this.options.length) {
                this.$emit('input', this.emptySelectOption())
            }
        },
        updated() {
            // Keep the scroll position centered on the selected option.
            let $ = {widget: this.$refs.widget}
            if (!$.widget) return

            $.input = this.$refs.input
            $.options = this.$refs.options
            $.selectedOption = $.widget.querySelector(`#option-${this.searchSelected.id}`)
            if ($.selectedOption) {
                $.options.scrollTop = $.selectedOption.offsetTop - $.input.offsetHeight - $.selectedOption.offsetHeight
            }
        },
        render: templates.field_select_search.r,
        staticRenderFns: templates.field_select_search.s,
    }

    return SelectField
}
