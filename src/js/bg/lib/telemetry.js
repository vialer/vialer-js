/* eslint-disable */


/**
* Basic telemetry using Google analytics platform.
*/
class Telemetry {
    /**
    * @param {ClickToDialApp} app - The application object.
    * @param {String} analyticsId - Google Analytics id.
    */
    constructor(app) {
        this.app = app
        this.settings = this.app.state.settings.telemetry

        this.settings.analyticsClientId = this.getAnalyticsClientId()
        this.telemetryServer = 'https://www.google-analytics.com/r/collect'
        // Allow sending events from the foreground.
        this.app.on('bg:telemetry:event', ({eventName, eventAction, eventLabel, override}) => {
            this.event(eventName, eventAction, eventLabel, override)
        })
    }



    /**
    * Format and send a minimal amount of usage data to the Telemetry
    * server for anonymized usage statistics when telemetry is enabled.
    * See https://developers.google.com/analytics/devguides/collection/protocol/v1/devguide#required
    * @param {String} eventName - The event category in GA.
    * @param {String} eventAction - The event action in GA.
    * @param {String} eventLabel - The event label in GA.
    * @returns {String} - A querystring of the tracking data.
    */
    event(eventName, eventAction, eventLabel, override = false) {
        if (!override && !this.settings.enabled) return

        let telemetryData = {
            cid: this.clientId,  // An anonymous ID to identify the client with.
            ea: eventAction,  // GA event action.
            ec: eventName,  // GA event name.
            el: eventLabel,  // GA event label.
            t: 'event',  // GA hit type.
            tid: this.settings.analyticsId,  // GA tracking or property ID.
            v: 1,  // Version.
        }
        navigator.sendBeacon(this.telemetryServer, this.app.utils.stringifySearch(telemetryData))
        this.app.logger.verbose(`${this}telemetry: "${eventName}:${eventAction}:${eventLabel}"`)
    }


    /**
    * Maintain a client UUID during sessions by storing/retrieving
    * it to/from localStorage.
    * @returns {String} - A persistent client ID.
    */
    getAnalyticsClientId() {
        if (!this.settings.analyticsClientId) {
            var d = new Date().getTime()
            this.settings.analyticsClientId = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
                var r = (d + Math.random() * 16) % 16 | 0
                d = Math.floor(d / 16)
                return (c=='x' ? r : (r&0x3|0x8)).toString(16)
            })
        }

        return this.settings.analyticsClientId
    }


    /**
    * Generate a representational name for this module. Used for logging.
    * @returns {String} - An identifier for this module.
    */
    toString() {
        return `${this.app}[telemetry] `
    }
}

module.exports = Telemetry
