module.exports = function(app) {

    let actions = {}

    /**
    * Set user state to unauthenticated and notify the background.
    */
    actions.logout = function() {
        this.$store.user.authenticated = false
        this.$store.user.password = null
        app.emit('bg:set_state', {
            user: {
                authenticated: false,
                password: null,
            },
        })
    }


    /**
    * Toggles widgets likaan accordeon and emits widget state back
    * to the background. Switches all widgets off, except the current one.
    * @param {String} widgetName - The widget to toggle.
    */
    actions.toggleActive = function(widgetName) {
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

        app.emit('bg:set_state', widgetState)
    }

    return actions
}
