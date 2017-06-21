'use strict'


/**
 * The Auth class handles login and logout actions.
 */
class Auth {

    /**
     * @param {ClickToDialApp} app - The application object.
     */
    constructor(app) {
        this.app = app
        this.app.logger.debug(`${this}init`)
    }


    logout() {
        this.app.logger.info(`${this}logout`)
        this.app.emit('logout')
        this.app.store.remove('user')
        this.app.modules.ui.resetWidgetState()
        this.app.resetModules()
        this.app.modules.page.reset()
        this.app.store.remove('username')
        this.app.store.remove('password')
    }


    /**
     * Log in with a username and password.
     */
    login(username, password) {
        // Make an api call to authenticate and save the credentials in storage.
        this.app.api.asyncRequest(this.app.api.getUrl('systemuser'), null, 'get', {
            onComplete: () => {
                // Reset login button.
                this.app.emit('login.indicator.stop')
            },
            onOk: (response) => {
                var user = response
                if (user.client) {
                    // Parse and set the client id as a new property.
                    user.client_id = user.client.replace(/[^\d.]/g, '')
                    this.app.store.set('user', user)

                    // Perform some actions on login.
                    this.postLogin(user)
                } else {
                    this.logout()
                }
            },
            onNotOk: () => {
                // Remove credentials from the store.
                this.app.store.remove('username')
                this.app.store.remove('password')
                this.app.emit('login.failed')
            },
        })
    }


    postLogin(user) {
        this.app.logger.info(`${this}login success`)
        this.app.emit('login.success', {user: user})
        // Reset seen notifications.
        let notificationsData = this.app.store.get('notifications')
        notificationsData.unauthorized = false
        this.app.store.set('notifications', notificationsData)
        // Start loading the widgets.
        this.app.modules.ui.refreshWidgets(false)
        // Setup a listener in case a tabs script wants to watch phone numbers.
        if (this.app.env.extension) {
            if (this.app.env.extension.background) {
                this.app.modules.page.watch()
            }
        } else {
            this.app.modules.page.watch()
        }
    }


    toString() {
        return `${this.app} [Auth]               `
    }
}

module.exports = Auth
