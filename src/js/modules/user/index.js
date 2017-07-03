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
                notificationsData.unauthorized = false
                this.app.store.set('notifications', notificationsData)
                // Start loading the widgets.
                this.app.modules.ui.refreshWidgets(false)
                this.app.logger.info(`${this}login successful`)
            } else if (this.app.api.NOTOK_STATUS.includes(res.status)) {
                // Remove credentials from the store.
                this.app.store.remove('username')
                this.app.store.remove('password')
                this.app.emit('user:login.failed')
            }
        })
    }


    logout() {
        this.app.logger.info(`${this}logout`)
        this.app.store.remove('user')
        this.app.modules.ui.resetWidgetState()
        this.app.resetModules()
        this.app.store.remove('username')
        this.app.store.remove('password')
        this.app.emit('user:logout.success')
        this.app.api.setupClient()
        this.app.timer.stopAllTimers()
    }


    toString() {
        return `${this.app}[user] `
    }
}

module.exports = UserModule
