/**
* @module ModuleUser
*/
const Module = require('../lib/module')


/**
* The User module is still bound to the VoIPGRID API.
*/
class ModuleUser extends Module {

    constructor(...args) {
        super(...args)

        this.app.on('bg:user:login', ({username, password}) => this.login(username, password))
        this.app.on('bg:user:logout', this.logout.bind(this))

        this.app.on('bg:user:unlock', ({password}) => {
            this.app.__unlockVault(this.app.state.user.username, password)
        })

        this.app.on('bg:user:update-token', async({callback}) => {
            await this._platformData()
            callback({token: this.app.state.user.platform.tokens.portal})
        })
    }


    _initialState() {
        return {
            authenticated: false,
            developer: false, // Unlocks experimental developer-only features.
            password: '',
            platform: {
                tokens: {
                    portal: null,
                    sip: null,
                },
            },
            username: null,
        }
    }


    async _platformData() {
        const res = await this.app.api.client.get('api/autologin/token/')
        this.app.setState({user: {platform: {tokens: {portal: res.data.token}}}})
    }


    /**
    * Make an api call with the current basic authentication to retrieve
    * profile information with. Save the credentials in storage when the call
    * is succesful, otherwise remove the credentials from the store.
    * @param {String} username - Email address to login with.
    * @param {String} password - Password to login with.
    */
    async login(username, password) {
        this.app.setState({user: {password, username}})
        this.app.api.setupClient(username, password)
        const res = await this.app.api.client.get('api/permission/systemuser/profile/')

        if (this.app.api.NOTOK_STATUS.includes(res.status)) {
            let message
            const icon = 'warning', type = 'warning'
            if (res.data.error) {
                let failMessage = res.data.error.message
                // Notify the user about being blocked out of the platform due to
                // too many login attempts.
                if (failMessage.includes('Too many failed login attempts')) {
                    const date = failMessage.substring(failMessage.length - 9, failMessage.length - 1)
                    window.failMessage = failMessage
                    message = this.app.$t('Too many failed login attempts; try again at {date}', {date})
                }
            } else {
                message = this.app.$t('Failed to login. Please check your credentials.')
            }
            this.app.emit('fg:notify', {icon, message, type})

            // Remove credentials from the in-memory store.
            this.app.setState({user: {password: ''}})
            return
        }

        let user = res.data
        user.realName = [user.first_name, user.preposition, user.last_name].filter((i) => i !== '').join(' ')

        // Only platform client users cannot use platform telephony features.
        if (!user.client) {
            this.logout()
            return
        }

        // Unlock the store now we have the username and password.
        if (this.app.store.get('state.encrypted')) {
            await this.app.__unlockVault(username, password)
        } else {
            await this.app.crypto.loadIdentity(username, password)
        }

        this.app.setState({user: {authenticated: true, username}}, {encrypt: false, persist: true})


        let startLayer
        if (this.app.state.app.installed) {
            // On install, go to the settings page.
            startLayer = 'settings'
            this.app.emit('fg:notify', {icon: 'settings', message: this.app.$t('Review your softphone and audio settings.'), timeout: 0, type: 'warning'})
        } else {
            startLayer = 'contacts'
            this.app.emit('fg:notify', {icon: 'user', message: this.app.$t('Welcome back, {user}', {user: user.realName}), type: 'success'})
        }

        this.app.setState({ui: {layer: startLayer, menubar: {default: 'active'}}}, {encrypt: false, persist: true})
        this.app.setState({
            // The `installed` and `updated` flag are toggled off after login.
            app: {installed: false, updated: false},
            user: {
                client_id: user.client.replace(/[^\d.]/g, ''),
                id: user.id,
                password: password,
                platform: {
                    tokens: {
                        sip: user.token,
                    },
                },
                realName: user.realName,
            },
        }, {persist: true})
        this.app.__initServices()
    }


    /**
    * Don't delete the salt. This will render the cached and stored
    * state useless. Removing the username from the lock indicates that
    * the user is logged out. The state cannot be used while it is
    * encrypted.
    */
    logout() {
        this.app.logger.info(`${this}logging out and cleaning up state`)
        // The password is restored on the state again on login
        // and after unlocking the vault. Logout may be called from
        // the the lock screen. At this moment, the encrypted state
        // can't be persisted.
        this.app.setState({ui: {layer: 'login'}, user: {password: ''}}, this.app.state.user.authenticated ? {persist: true} : {})
        this.app.setState({settings: {vault: {active: false, unlocked: false}}, user: {authenticated: false}}, {encrypt: false, persist: true})
        // Remove credentials from basic auth.
        this.app.api.setupClient()
        // Disconnect without reconnect attempt.
        this.app.modules.calls.disconnect(false)
        this.app.emit('fg:notify', {icon: 'user', message: this.app.$t('Goodbye!'), type: 'success'})
        this.app.setState({ui: {menubar: {default: 'inactive'}}})
    }


    toString() {
        return `${this.app}[user] `
    }
}

module.exports = ModuleUser
