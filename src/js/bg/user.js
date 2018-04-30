/**
* @module User
*/
class UserModule {

    constructor(app) {
        this.app = app
        this.addListeners()
    }


    addListeners() {
        this.app.on('user:login.attempt', ({username, email, password}) => {
            if (username) {
                this.app.store.set('username', username)
            }
            if (password) {
                this.app.store.set('password', password)
            }
            this.app.emit('user:login.in_progress')
            this.login({
                password: this.app.store.get('password'),
                username: this.app.store.get('username'),
            })
        })

        this.app.on('user:loginTwoFactor.attempt', ({twoFactorToken}) => {
            this.app.store.set('twoFactorToken', twoFactorToken)
            this.app.emit('user:loginTwoFactor.in_progress')
            this.login({
                password: this.app.store.get('password'),
                twoFactorToken: this.app.store.get('twoFactorToken'),
                username: this.app.store.get('username'),
            })
        })

        this.app.on('user:logout.attempt', () => {
            this.logout()
        })
    }

    clearTemporaryData() {
        this.app.store.remove('password')
        this.app.store.remove('twoFactorToken')
    }


    /**
    * Make an api call to retrieve a token and check if 2fa is needed, after which
    * profile information is retreived. Save the credentials in storage when the call
    * is succesful, otherwise remove the credentials from the store.
    * @param {String} username - e-mail address to login with.
    * @param {String} password - password to login with.
    * @param {String} twoFactorToken - two factor authentication token
    */
    login({username, password, twoFactorToken}) {
        const payload = {
            email: username,
            password,
        }

        if (twoFactorToken) {
            payload.two_factor_token = twoFactorToken
        }

        this.app.api.client.post('api/permission/apitoken/', payload)
            .then(({status, data, data: { apitoken, api_token }}) => {

                // Be aware that the response from api/permissions/apitoken is very confusing
                // it returns an api_token property when successful
                // it returns an apitoken object when input is invalid or needs more data
                const token = api_token
                const errors = apitoken;

                // Ok let's start on our journey...
                if (this.app.api.NOTOK_STATUS.includes(status)) {

                    // When username or password didn't match their names are both in the errors object
                    if (errors.username && errors.password) {
                        this.clearTemporaryData()
                        this.app.emit('user:login.failed', {reason: status})

                    } else if (errors.two_factor_token) {
                        // If the error has something to do with the 2fa token it can be found in the
                        // 'two_factor_token' property

                        const [twoFactorErrorMessage] = errors.two_factor_token

                        // The error can either mean the 2fa token is mandatory and needds ot be supplied
                        if (twoFactorErrorMessage.toLowerCase().includes('required')) {
                            this.app.emit('user:login.twoFactorMandatory')
                        } else {
                            // Or it can mean the 2fa token that was provided is incorrect
                            this.app.emit('user:twoFactorLogin.failed')
                        }
                    } else {
                        // Kitchen sink for all other situations
                        this.app.emit('user:login.failed', {reason: status})
                    }
                } else if (this.app.api.OK_STATUS.includes(status)) {
                    if (token) {
                        this.app.store.set('token', `Token ${username}:${token}`)
                        // After the token is stored we can call services since the token is automatically
                        // added to all the requests
                        return this.app.api.client.get('api/permission/systemuser/profile/')
                    }
                }
            })
            .then(({data, status} = {}) => {
                if (this.app.api.OK_STATUS.includes(status)) {
                    this.clearTemporaryData()
                    if (!data.client) {
                        this.logout()
                        return
                    }

                    // Parse and set the client id as a new property.
                    data.client_id = data.client.replace(/[^\d.]/g, '')
                    this.app.store.set('user', data)

                    // Perform some actions on login.
                    this.app.emit('user:login.success', {user: data}, 'both')

                    // Reset seen notifications.
                    let notificationsData = this.app.store.get('notifications')
                    if (!notificationsData) notificationsData = {}
                    notificationsData.unauthorized = false
                    this.app.store.set('notifications', notificationsData)
                    // Start loading the widgets.
                    this.app.modules.ui.refreshWidgets(false)
                    this.app.logger.info(`${this}login successful`)
                    // Connect to the sip service on succesful login.
                    this.app.sip.connect()
                }
            })
            .catch( err => {
                this.clearTemporaryData()
                this.app.emit('user:login.failed', {reason: err})
            })
    }


    logout() {
        this.app.logger.info(`${this}logout`)
        this.app.store.remove('widgets')
        this.app.store.remove('isMainPanelOpen')
        this.app.resetModules()
        // Remove credentials for basic auth.
        this.app.store.remove('password')
        // Remove cached sip status.
        this.app.store.remove('sip')
        // Remove the widget cache.
        this.app.store.remove('widgets')
        this.app.store.remove('token')
        this.app.emit('user:logout.success')
        this.app.timer.stopAllTimers()

        // Disconnect without reconnect attempt.
        this.app.sip.disconnect(false)
    }


    toString() {
        return `${this.app}[user] `
    }
}

module.exports = UserModule
