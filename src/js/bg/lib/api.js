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
        this.NOTOK_STATUS = [400, 401, 403, 404, 'Network Error']
        this.UNAUTHORIZED_STATUS = [401]

        this.client = axios.create({
            baseURL: this.app.store.get('platformUrl'),
            timeout: 15000,
        })

        this.client.interceptors.request.use(config => {
            const token = this.app.store.get('token')
            if (token) {
                config.headers.authorization = token
            }
            return config;
        }, (error) => {
            // Do something with request error
            return Promise.reject(error);
        });
        this.client.interceptors.response.use(function(response) {
            return response
        }, (err) => {
            // Catch Network Errors.
            if (err.message === 'Network Error') {
                return Promise.resolve({status: 'Network Error'})
            }
            // Reject all status codes from 500 and timeouts.
            if (!err.response || err.response.status >= 500) {
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
            if (!this.app.store.get('notifications').hasOwnProperty('unauthorized') ||
                !this.app.store.get('notifications').unauthorized) {

                this.app.logger.notification(this.app.i18n.translate('unauthorizedNotificationText'))
                let notificationsData = this.app.store.get('notifications')
                notificationsData.unauthorized = true
                this.app.store.set('notifications', notificationsData)
            }
        }
    }
}

module.exports = Api
