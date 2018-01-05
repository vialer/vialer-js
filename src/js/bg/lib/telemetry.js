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

        this.settings.clientId = this.getClientId()
        this.telemetryServer = 'https://www.google-analytics.com/r/collect'
        // Map telemetry setting from the store to this object.

        // Popup scripts sends an event to notify about the user's
        // choice for telemetry.
        this.app.on('telemetry', (data) => {
            this.settings.enabled = data.enabled
            this.event('Telemetry', 'ToggleOnOff', this.enabled ? 'on' : 'off', true)
            this.app.logger.debug(`${this}telemetry switched ${this.enabled ? 'on' : 'off'}`)
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
        if (!override && !this.enabled) {
            this.app.logger.debug(`${this}telemetry disabled`)
            return
        }

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
        this.app.logger.debug(`${this}sending telemetry data: "${eventName}:${eventAction}:${eventLabel}"`)
    }


    /**
    * Maintain a client UUID during sessions by storing/retrieving
    * it to/from localStorage.
    * @returns {String} - A persistent client ID.
    */
    getClientId() {
        if (!this.settings.clientId) {
            var d = new Date().getTime()
            this.settings.clientId = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
                var r = (d + Math.random() * 16) % 16 | 0
                d = Math.floor(d / 16)
                return (c=='x' ? r : (r&0x3|0x8)).toString(16)
            })
        }

        return this.settings.clientId
    }


    toString() {
        return `${this.app}[analytics] `
    }
}

module.exports = Telemetry
