module.exports = (app) => {

    const BaseField = Vue.component('BaseField', require('../base')(app))

    /**
    * @memberof fg.components
    */
    const PasswordField = {
        extends: BaseField,
        props: {
            placeholder: String,
            value: null,
        },
        data() {
            return {
                visible: false,
            }
        },
        mounted() {
            if (this.autofocus) {
                this.$nextTick(() => this.$refs.input.focus())
            }
        },
        methods: {
            updateModel($event) {
                this.$emit('input', $event.target.value)
            },
            /*
            * Toggles visibility flag on a password field.
            */
            toggleVisible() {
                this.visible = !this.visible
            },
        },
        render: templates.field_password.r,
        staticRenderFns: templates.field_password.s,
    }

    return PasswordField
}
