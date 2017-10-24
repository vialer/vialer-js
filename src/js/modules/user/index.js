/**
* @module User
*/
const UserActions = require('./actions')


/**
* The User module.
*/
class UserModule {

    constructor(app) {
        this.app = app
        this.actions = new UserActions(app, this)
    }


    /**
    * Make an api call with the current basic authentication to retrieve
    * profile information with. Save the credentials in storage when the call
    * is succesful, otherwise remove the credentials from the store.
    * @param {String} username - Username to login with.
    * @param {String} password - Password to login with.
    */
    login(username, password) {
        this.app.api.setupClient(username, password)
        this.app.api.client.get('api/permission/systemuser/profile/').then((res) => {
            if (this.app.api.OK_STATUS.includes(res.status)) {
                let user = res.data
                if (!user.client) {
                    this.logout()
                    return
                }

                // Parse and set the client id as a new property.
                user.client_id = user.client.replace(/[^\d.]/g, '')
                this.app.store.set('user', user)

                // Perform some actions on login.
                this.app.emit('user:login.success', {user: user}, 'both')
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
            } else if (this.app.api.NOTOK_STATUS.includes(res.status)) {
                // Remove credentials from the store.
                this.app.store.remove('username')
                this.app.store.remove('password')
                this.app.emit('user:login.failed', {reason: res.status})
            }
        })
    }


    logout() {
        this.app.logger.info(`${this}logout`)
        this.app.modules.ui.resetWidgetState()
        this.app.resetModules()
        // Remove credentials for basic auth.
        this.app.store.remove('user')
        this.app.store.remove('password')
        // Remove cached sip status.
        this.app.store.remove('sip')
        // Remove the widget cache.
        this.app.store.remove('widgets')
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
