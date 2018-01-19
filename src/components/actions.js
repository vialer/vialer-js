// Actions shared across components. Don't modify state local component
// state from here.
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

    return actions
}
