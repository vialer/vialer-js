/**
* The User module deals with everything that requires some
* form of authentication. It is currently very tighly coupled
* with the VoIPGRID vendor, but in theory should be able to deal
* with other authentication backends.
* @module ModuleUser
*/
const Plugin = require('vialer-js/lib/plugin')


/**
* Main entrypoint for User.
* @memberof AppBackground.plugins
*/
class PluginUser extends Plugin {
    /**
    * Setup events that can be called upon from `AppForeground`.
    * @param {AppBackground} app - The background application.
    * @param {UserProvider} UserAdapter - An adapter that handles authentication and authorization.
    */
    constructor(app, UserAdapter) {
        super(app)

        this.adapter = new UserAdapter(app)

        this.app.on('bg:user:account_select', this.adapter._selectAccount.bind(this))

        // Other implementation may use other user identifiers than email,
        // that's why the main event uses `username` instead of `email`.
        this.app.on('bg:user:login', (...args) => {
            try {this.adapter.login(...args)} catch (err) {console.trace(err)}
        })
        this.app.on('bg:user:logout', (...args) => {
            try {this.adapter.logout(...args)} catch (err) {console.trace(err)}
        })

        this.app.on('bg:user:unlock', (...args) => {
            try {this.adapter.unlock(...args)} catch (err) {console.trace(err)}
        })

        this.app.on('bg:user:set_session', ({session}) => {
            app.changeSession(session)
        })

        this.app.on('bg:user:remove_session', ({session}) => {
            app.removeSession(session)
        })
    }


    /**
    * Initializes the module's store.
    * @returns {Object} The module's store properties.
    */
    _initialState() {
        return Object.assign({
            authenticated: false,
            developer: false,
            status: null,
            username: null,
        }, this.adapter._initialState())
    }


    /**
    * Call for platform data from the provider.
    */
    async _platformData() {
        if (this.adapter._platformData) {
            await this.adapter._platformData()
        }
    }


    /**
    * Generate a representational name for this module. Used for logging.
    * @returns {String} - An identifier for this module.
    */
    toString() {
        return `${this.app}[user] `
    }
}

module.exports = PluginUser
