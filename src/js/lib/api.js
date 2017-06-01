'use strict'

let base64encode = btoa


/**
 * Talks to the VoIPGRID API.
 */
class Api {

    /**
     * @param {ClickToDialApp} app - The application object.
     */
    constructor(app) {
        this.app = app
        this.app.logger.debug(`${this}init`)
    }


    getPlatformUrl() {
        let platformUrl = this.app.store.get('platformUrl')
        if (platformUrl.length && platformUrl.lastIndexOf('/') !== platformUrl.length - 1) {
            // Force trailing slash.
            platformUrl = platformUrl + '/'
        }

        if (!platformUrl.trim().length) {
            platformUrl = 'https://partner.voipgrid.nl/'
            this.app.store.set('platformUrl', platformUrl)
        }

        return platformUrl
    }


    /**
     * Get an url to send requests to.
     */
    getUrl(api) {
        return {
            autologin: 'autologin/token/',
            clicktodial: 'clicktodial/',
            phoneaccount: 'phoneaccount/basic/phoneaccount/',
            queuecallgroup: 'queuecallgroup/',
            selecteduserdestination: 'selecteduserdestination/',
            systemuser: 'permission/systemuser/profile/',
            userdestination: 'userdestination/',
        }[api]
    }


    /**
     * Make an (asynchronous) api call.
     */
    asyncRequest(path, content, requestMethod, callbacks) {
        this.app.logger.info(`${this}calling api: ${path}`)

        if (content) {
            content = JSON.stringify(content)
            this.app.logger.info(`${this}using content: ${content}`)
        }

        if (!callbacks.onError) {
            callbacks.onError = () => {
                this.app.logger.info(`${this}error in retrieveCredentials`)
            }
        }

        if (!callbacks.onUnauthorized) {
            callbacks.onUnauthorized = () => {
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

                if (callbacks.onNotOk) {
                    callbacks.onNotOk()
                }
            };
        }

        let platformUrl = this.getPlatformUrl()

        $.ajax({
            url: `${platformUrl}api/${path}`,
            data: content,
            dataType: 'json',
            contentType: 'application/json',
            headers: {
                Authorization: 'Basic ' + base64encode(`${this.app.store.get('username')}:${this.app.store.get('password')}`),
            },
            type: requestMethod,
        })
        .always((data_or_jqXHR, textStatus, jqXHR_or_errorThrown) => {
            let status = 'UNKNOWN'
            if (data_or_jqXHR && data_or_jqXHR.status) {
                status = data_or_jqXHR.status
            }
            if (jqXHR_or_errorThrown && jqXHR_or_errorThrown.status) {
                status = jqXHR_or_errorThrown.status
            }
            if (callbacks.onComplete) {
                callbacks.onComplete()
            }
        })
        .done((data, textStatus, jqXHR) => {
            switch (jqXHR.status) {
            case 200:
            case 201:
            case 202:
            case 204:
                if (callbacks.onOk) {
                    callbacks.onOk(data)
                }
                break
            }
        })
        .fail((jqXHR, textStatus, errorThrown) => {
            switch (jqXHR.status) {
            // Failed to authenticate.
            case 401:
                if (callbacks.onUnauthorized) {
                    callbacks.onUnauthorized()
                } else {
                    if (callbacks.onNotOk) {
                        callbacks.onNotOk()
                    }

                    // If not logged out by callbacks.onNotOk, log out here.
                    if (this.app.store.get('user')) {
                        this.app.auth.logout()
                    }
                }
                break
            // Not the right permissions.
            case 403:
                if (callbacks.onForbidden) {
                    callbacks.onForbidden()
                } else {
                    if (callbacks.onNotOk) {
                        callbacks.onNotOk()
                    }
                }
                break
            default:
                if (callbacks.onNotOk) {
                    callbacks.onNotOk()
                }
            }
        })
    }


    toString() {
        return `${this.app} [Api]                `
    }
}

module.exports = Api
