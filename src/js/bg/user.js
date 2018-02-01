/**
* @module User
*/
class UserModule {

    constructor(app) {
        this.app = app

        this.app.on('bg:user:login', (data) => {
            Object.assign(this.app.state.user, {
                password: data.password,
                username: data.username,
            })

            this.login(data.username, data.password)
        })

        this.app.on('bg:user:logout', () => {
            this.logout()
        })
    }


    /**
    * Make an api call with the current basic authentication to retrieve
    * profile information with. Save the credentials in storage when the call
    * is succesful, otherwise remove the credentials from the store.
    * @param {String} username - Email address to login with.
    * @param {String} password - Password to login with.
    */
    async login(username, password) {
        this.app.api.setupClient(username, password)
        const res = await this.app.api.client.get('api/permission/systemuser/profile/')

        if (this.app.api.NOTOK_STATUS.includes(res.status)) {
            this.app.emit('fg:notify', {icon: 'warning', message: this.app.$t('Invalid credentials'), type: 'warning'})
            // Remove credentials from the store.
            Object.assign(this.app.state.user, {authenticated: false, password: ''})
            return
        }

        let user = res.data
        // Only platform client users cannot use platform telephony features.
        if (!user.client) {
            this.logout()
            return
        }

        this.app.setState({
            ui: {layer: 'contacts'},
            user: {
                authenticated: true,
                client_id: user.client.replace(/[^\d.]/g, ''),
                password: password,
                token: user.token,
                username: username,
            },
        }, {persist: true})

        this.app.getModuleApiData()

        this.app.emit('fg:notify', {icon: 'user', message: this.app.$t('Logged in succesfully'), type: 'success'})
        // Connect to the sip service on succesful login.
        this.app.modules.calls.connect()
    }


    logout() {
        this.app.logger.info(`${this}logging out and cleaning up state`)
        this.app.setState(this.app._resetState(), {persist: true})
        // Remove credentials for basic auth.
        this.app.api.setupClient()
        // Disconnect without reconnect attempt.
        this.app.modules.calls.disconnect(false)
        this.app.emit('fg:notify', {icon: 'user', message: this.app.$t('You are logged out'), type: 'success'})
    }


    toString() {
        return `${this.app}[user] `
    }
}

module.exports = UserModule
