const axios = require('axios')


/**
 * Talks to the VoIPGRID API.
 */
class Api {
    /**
     * @param {ClickToDialApp} app - The application object.
     */
    constructor(app) {
        this.app = app
        this.OK_STATUS = [200, 201, 202, 204]
        this.NOTOK_STATUS = [401, 403, 'Network Error']
        this.UNAUTHORIZED_STATUS = [401]
        this.setupClient(this.app.store.get('username'), this.app.store.get('password'))
    }

    /**
     * Set a http client with or without basic authentication.
     */
    setupClient(username, password) {
        let clientOptions = {baseURL: this.app.store.get('platformUrl')}
        if (username && password) {
            this.app.logger.info(`${this}Set api client with basic auth for user ${username}`)
            clientOptions.auth = {
                username: username,
                password: password,
            }
        } else {
            this.app.logger.info(`${this}Set unauthenticated api client`)
        }
        this.client = axios.create(clientOptions)
        this.client.interceptors.response.use(function(response) {
            return response
        }, (err) => {
            // Catch Network Errors.
            if (err.message === 'Network Error') {
                return Promise.resolve({'status': 'Network Error'})
            }
            // Reject all status codes from 500.
            if (err.response.status >= 500) {
                return Promise.reject(err)
            }
            // All other error codes are part of the normal application flow.
            return Promise.resolve(err.response)
        })
    }


    toString() {
        return `${this.app}[api] `
    }


    unauthorizedMessage() {
        // Show this notification after being logged in once properly.
        if (this.app.store.get('user')) {
            // Don't show more than once per login session.
            if (!this.app.store.get('notifications').hasOwnProperty('unauthorized') || !this.app.store.get('notifications').unauthorized) {
                this.app.logger.notification(this.app.i18n.translate('unauthorizedNotificationText'))

                let notificationsData = this.app.store.get('notifications')
                notificationsData.unauthorized = true
                this.app.store.set('notifications', notificationsData)
            }
        }
    }
}

module.exports = Api
