module.exports = (app) => {

    const BaseField = Vue.component('BaseField', require('../base')(app))

    /**
    * @memberof fg.components
    */
    const TextField = {
        extends: BaseField,
        props: {
            value: null,
            placeholder: String,
        },
        mounted() {
            if (this.autofocus) {
                this.$nextTick(() => this.$refs.input.focus())
            }
        },
        methods: {
            updateModel: function(event) {
                this.$emit('input', event.target.value)
            },
        },
        render: templates.field_text.r,
        staticRenderFns: templates.field_text.s,
    }

    return TextField
}
