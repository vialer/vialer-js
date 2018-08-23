/**
* Base class that each UserProvider must inherit from.
*/
class UserAdapter {
    constructor(app) {
        this.app = app
    }


    /**
    * Placeholder that warns that this method
    * needs to be implemented in the adapter.
    * @param {Object} options - Options to pass.
    * @param {Object} options.account - The account credentials.
    * @param {Function} options.callback - Called when the account is set.
    */
    _selectAccount({account, callback}) {
        this.app.logger.info(`${this}account selection not implemented!`)
    }


    /**
    * Some default actions that are done, no matter
    * what login provider is being used.
    * @param {Object} options - Options to pass.
    * @param {String} options.password - The password that is used to unlock a session.
    * @param {String} options.userFields - The fields that the particular user requires.
    * @param {String} options.username - The username the user is identified with.
    */
    async login({password, userFields, username}) {
        await this.app.__initSession({password})
        this.app.__storeWatchers(true)

        this.app.setState({
            // The `installed` and `updated` flag are toggled off after login.
            app: {installed: false, updated: false},
            ui: {layer: 'calls'},
            user: {username},
        }, {encrypt: false, persist: true})

        await this.app.setState({user: userFields}, {persist: true})
    }


    /**
    * Remove any stored session key, but don't delete the salt.
    * This will render the cached and stored state useless.
    */
    async logout() {
        this.app.logger.info(`${this}logging out and cleaning up state`)
        this.app.__storeWatchers(false)
        await this.app.changeSession(null, {}, {logout: true})

        // Remove credentials from basic auth.
        this.app.api.setupClient()
        // Disconnect without reconnect attempt.
        this.app.plugins.calls.disconnect(false)
        this.app.emit('bg:user:logged_out', {}, true)

        // Fallback to the browser language or to english.
        const languages = this.app.state.settings.language.options.map(i => i.id)
        if (this.app.env.isBrowser && languages.includes(navigator.language)) {
            this.app.logger.info(`${this}switching back to browser language: ${navigator.language}`)
            Vue.i18n.set(navigator.language)
        }
    }


    /**
    * Generate a representational name for this module. Used for logging.
    * @returns {String} - An identifier for this module.
    */
    toString() {
        return `${this.app}[user-adapter] `
    }


    /**
    * This method is called when the correct session is already
    * selected. No need to change sessions again.
    */
    async unlock({username, password}) {
        this.app.setState({user: {status: 'unlock'}})
        this.app.logger.info(`${this}unlocking session "${username}"`)

        try {
            await this.app.__initSession({password})
            this.app.__storeWatchers(true)
            this.app.api.setupClient(username, this.app.state.user.token)
            this.app.setState({ui: {layer: 'calls'}}, {encrypt: false, persist: true})
            this.app.notify({icon: 'user', message: this.app.$t('welcome back!'), type: 'info'})
            this.app.__initServices(true)
        } catch (err) {
            // Wrong password, resulting in a failure to decrypt.
            this.app.setState({
                ui: {layer: 'login'},
                user: {authenticated: false},
            }, {encrypt: false, persist: true})
            const message = this.app.$t('failed to unlock session; check your password.')
            this.app.notify({icon: 'warning', message, type: 'danger'})
        } finally {
            this.app.setState({user: {status: null}})
        }
    }
}

module.exports = UserAdapter
