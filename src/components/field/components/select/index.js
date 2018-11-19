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
        methods: {
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

            /**
            * Emit the child component's state back to it's
            * parent component. The parent container captures the value
            * using `:model.sync` instead of `v-model`.
            * @param {Event} event - The original browser event that triggered the change.
            */
            updateModel: function(event) {
                let value = event.target.value
                if (!value) {
                    this.$emit('input', this.emptySelectOption())
                } else {
                    for (const option of this.options) {
                        if (String(option.id) === String(value)) {
                            // Do not pass a reference or you may end up
                            // in a situation that changing a field's
                            // selected option, also changes the item in
                            // the options Array.
                            this.$emit('input', app.utils.copyObject(option))
                        }
                    }
                }
            },
        },
        mounted: function() {
            // There are no options which means there won't be a filled
            // model value. Force an update here, because the model value
            // may still be cached from the store.
            if (!this.options.length) {
                this.$emit('input', this.emptySelectOption())
            }
        },
        render: templates.field_select.r,
        staticRenderFns: templates.field_select.s,
    }

    return SelectField
}
