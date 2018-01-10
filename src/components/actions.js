module.exports = function(app) {

    let actions = {}

    /**
    * Set user state to unauthenticated and notify the background.
    */
    actions.logout = function() {
        this.$store.user.authenticated = false
        this.$store.user.password = null
        app.setState({
            user: {
                authenticated: false,
                password: null,
            },
        }, true)
    }


    /**
    * Toggles widgets likaan accordeon and emits widget state back
    * to the background. Switches all widgets off, except the current one.
    * @param {Event} e - The click event.
    * @param {String} widgetName - The widget to toggle.
    */
    actions.toggleActive = function(e, widgetName) {
        // Don't toggle widgets when clicking on an input.
        if (e.srcElement.tagName === 'INPUT') return
        // Minimal template for deep merge.
        let widgetState = {
            availability: {widget: {active: null}},
            contacts: {widget: {active: null}},
            queues: {widget: {active: null}},
        }
        for (let moduleName of Object.keys(this.$store)) {
            // Limit for modules that have a widget.
            if ('widget' in this.$store[moduleName]) {
                if (moduleName !== widgetName) {
                    this.$store[moduleName].widget.active = false
                    widgetState[moduleName].widget.active = false
                } else {
                    this.$store[moduleName].widget.active = !this.module.widget.active
                    widgetState[moduleName].widget.active = this.$store[moduleName].widget.active
                }
            }
        }

        app.emit('bg:set_state', {
            persist: true,
            state: widgetState,
        })
    }

    return actions
}
