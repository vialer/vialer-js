/* eslint-disable */


/**
* Google analytics helper class.
*/
class Analytics {
    /**
    * @param {ClickToDialApp} app - The application object.
    * @param {String} analyticsId - Google Analytics id.
    */
    constructor(app, analyticsId) {
        this.app = app
        this.analyticsId = analyticsId
        this.clientId = this.getClientId()
    }



    /**
    * Format the minimal amount of Google Analytics data that is being sent
    * Google servers for usage statistics.
    * See https://developers.google.com/analytics/devguides/collection/protocol/v1/devguide#required
    * @param {String} eventName - The event category in GA.
    * @param {String} eventAction - The event action in GA.
    * @param {String} eventLabel - The event label in GA.
    * @returns {String} - A querystring of the tracking data.
    */
    formatEvent(eventName, eventAction, eventLabel) {
        let analyticsData = {
            cid: this.clientId,  // An anonymous ID to identify the client with.
            ea: eventAction,  // GA event action.
            ec: eventName,  // GA event name.
            el: eventLabel,  // GA event label.
            t: 'event',  // GA hit type.
            tid: this.analyticsId,  // GA tracking or property ID.
            v: 1,  // Version.
        }

        return this.app.utils.stringifySearch(analyticsData)
    }


    /**
    * Maintain a client UUID during sessions by storing/retrieving
    * it to/from localStorage.
    * @returns {String} - A persistent client ID.
    */
    getClientId() {
        let clientId = this.app.store.get('clientId')
        if (!clientId) {
            var d = new Date().getTime()
            clientId = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
                var r = (d + Math.random() * 16) % 16 | 0
                d = Math.floor(d / 16)
                return (c=='x' ? r : (r&0x3|0x8)).toString(16)
            })
            this.app.store.set('clientId', clientId)
        }

        return clientId
    }


    toString() {
        return `${this.app}[analytics] `
    }


    /**
    * A function that will POST a Click-to-Dial Event to Google Analytics.
    * @param {String} eventLabel - Label that will be given to the event.
    */
    trackClickToDial(eventLabel) {
        this.app.logger.debug(`${this}send call event`)
        let data = this.formatEvent('Calls', 'Initiate ConnectAB', eventLabel)
        navigator.sendBeacon('https://www.google-analytics.com/r/collect', data)
    }
}

module.exports = Analytics
