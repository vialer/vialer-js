/**
* @module User
*/
class UserModule {

    constructor(app) {
        this.app = app
        this.addListeners()
    }


    addListeners() {
        this.app.on('user:login.attempt', (data) => {
            Object.assign(this.app.state.user, {
                password: data.password,
                username: data.username,
            })

            this.app.emit('user:login.in_progress')
            this.login(data.username, data.password)
        })

        this.app.on('user:logout.attempt', () => {
            this.logout()
        })
    }


    /**
    * Make an api call with the current basic authentication to retrieve
    * profile information with. Save the credentials in storage when the call
    * is succesful, otherwise remove the credentials from the store.
    * @param {String} username - Username to login with.
    * @param {String} password - Password to login with.
    */
    login(email, password) {
        this.app.api.setupClient(email, password)
        this.app.api.client.get('api/permission/systemuser/profile/').then(async(res) => {
            if (this.app.api.OK_STATUS.includes(res.status)) {
                let _user = res.data

                if (!_user.client) {
                    this.logout()
                    return
                }


                const _res = await this.app.api.client.get('api/userdestination/')

                const phoneAccountId = _res.data.objects[0].selecteduserdestination.phoneaccount
                const __res = await this.app.api.client.get(`api/phoneaccount/phoneaccount/${phoneAccountId}`)

                Object.assign(this.app.state.user, {
                    authenticated: true,
                    client_id: _user.client.replace(/[^\d.]/g, ''),
                    email: email,
                    password: password, // TODO: Use tokens.
                    selectedUserdestination: __res.data,
                })

                this.app.emit('fg:set_state', {
                    user: this.app.state.user,
                })
                // Persist state.
                this.app.store.set('state', this.app.state)

                // Start loading the widgets.
                this.app.logger.info(`${this}login successful`)
                // Connect to the sip service on succesful login.
                this.app.sip.connect()
            } else if (this.app.api.NOTOK_STATUS.includes(res.status)) {
                // Remove credentials from the store.
                this.app.state.user.username = ''
                this.app.state.user.password = ''
                this.app.emit('user:login.failed', {reason: res.status})
            }
        })
    }


    logout() {
        this.app.logger.info(`${this}logout`)
        this.app.store.remove('widgets')
        this.app.store.remove('isMainPanelOpen')
        this.app.resetModules()
        this.app.state.user.password = ''
        // Remove credentials for basic auth.
        this.app.emit('user:logout.success')
        this.app.api.setupClient()
        this.app.timer.stopAllTimers()

        // Disconnect without reconnect attempt.
        this.app.sip.disconnect(false)
    }


    toString() {
        return `${this.app}[user] `
    }
}

module.exports = UserModule
