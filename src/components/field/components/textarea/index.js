module.exports = (app) => {

    const BaseField = Vue.component('BaseField', require('../base')(app))

    /**
    * @memberof fg.components
    */
    const TextAreaField = {
        extends: BaseField,
        props: {
            value: Array,
            placeholder: String,
        },
        methods: {
            updateModel(event) {
                let lines = event.target.value.split('\n')
                this.$emit('input', lines)
            },
        },
        // TODO updateModel which touches validation.
        render: templates.field_textarea.r,
        staticRenderFns: templates.field_textarea.s,
    }

    return TextAreaField
}
