'use strict'

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
        this.NOTOK_STATUS = [401, 403]
        this.UNAUTHORIZED_STATUS = [401]

        this.client = axios.create({
            baseURL: this.getPlatformUrl(),
            auth: {
                username: this.app.store.get('username'),
                password: this.app.store.get('password'),
            },
        })

        this.client.interceptors.response.use(function(response) {
            return response
        }, (err) => {
            // Reject all status codes above 500 and serve the oops page.
            if (err.response.status >= 500) {
                // We got an API error. Show the default oops page.
                return Promise.reject(err)
            }

            // All other error codes are part of the normal application flow.
            return Promise.resolve(err)
        })
    }


    getPlatformUrl() {
        let platformUrl = this.app.store.get('platformUrl')
        if (platformUrl.length && platformUrl.lastIndexOf('/') !== platformUrl.length - 1) {
            // Force trailing slash.
            platformUrl = platformUrl + '/'
        }
        // Set a default platform url when it's not set.
        if (!platformUrl.trim().length) {
            platformUrl = 'https://partner.voipgrid.nl/'
            this.app.store.set('platformUrl', platformUrl)
        }

        return platformUrl
    }


    unauthorizedMessage() {
        // Show this notification after being logged in once properly.
        if (this.app.store.get('user')) {
            // Don't show more than once per login session.
            if (!this.app.store.get('notifications').hasOwnProperty('unauthorized') || !this.app.store.get('notifications').unauthorized) {
                if (window.webkitNotifications) {
                    webkitNotifications.createNotification('', '', this.app.translate('unauthorizedNotificationText')).show()
                } else {
                    this.app.browser.notifications.create('unauthorized', {
                        type: 'basic',
                        iconUrl: '',
                        title: this.app.translate('unauthorizedNotificationText'),
                        message: '',
                    }, () => {})
                }
                let notificationsData = this.app.store.get('notifications')
                notificationsData.unauthorized = true
                this.app.store.set('notifications', notificationsData)
            }
        }
    }


    toString() {
        return `${this.app} [Api]                `
    }
}

module.exports = Api
