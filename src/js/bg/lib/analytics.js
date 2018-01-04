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
        this.telemetryServer = 'https://www.google-analytics.com/r/collect'

        if (this.app.store.get('telemetry') !== null) {
            this.enabled = Boolean(this.app.store.get('telemetry'))
        } else {
            this.enabled = false
        }

        // Popup scripts sends an event to notify about the user's
        // choice for telemetry.
        this.app.on('telemetry', (data) => {
            this.enabled = data.enabled
            this.app.store.set('telemetry', this.enabled ? 1 : 0)
            this.telemetryEvent('Telemetry', 'ToggleOnOff', this.enabled ? 'on' : 'off', true)
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
    telemetryEvent(eventName, eventAction, eventLabel, override = false) {
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
            tid: this.analyticsId,  // GA tracking or property ID.
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
}

module.exports = Analytics
