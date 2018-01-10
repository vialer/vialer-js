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
    * @param {String} email - Email to login with.
    * @param {String} password - Password to login with.
    */
    async login(email, password) {
        this.app.api.setupClient(email, password)
        const res = await this.app.api.client.get('api/permission/systemuser/profile/')

        if (this.app.api.NOTOK_STATUS.includes(res.status)) {
            // Remove credentials from the store.
            Object.assign(this.app.state.user, {
                authenticated: false,
                email: '',
                password: '',
            })
        }

        let user = res.data
        // Only platform client users cannot use platform telephony features.
        if (!user.client) {
            this.logout()
            return
        }

        this.app.modules.availability.getApiData()

        this.app.setState({
            ui: {
                layer: 'app',
            },
            user: {
                authenticated: true,
                client_id: user.client.replace(/[^\d.]/g, ''),
                email: email,
                password: password,
            },
        }, true)

        // Connect to the sip service on succesful login.
        this.app.sip.connect()
    }


    logout() {
        this.app.logger.info(`${this}logout`)
        this.app.resetModules()
        this.app.setState({
            ui: {
                layer: 'login',
            },
            user: {
                password: '',
            },
        })
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
