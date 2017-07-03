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

        // Keep the semi-colon here to prevent ASI ambiguity.
        ;(function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function() {
                (i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
            m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a, m)
        })(window, document, 'script', 'https://www.google-analytics.com/analytics.js','ga');
        ga('create', analyticsId, 'auto')
        ga('set', 'checkProtocolTask', function(){})
    }


    toString() {
        return `${this.app}[analytics] `
    }


    /**
     * A function that will POST a Click-to-Dial Event to Google Analytics.
     * @param {String} origin - Label that will be given to the event.
     */
    trackClickToDial(origin) {
        this.app.logger.debug(`${this}send call event`)
        ga('send', 'event', 'Calls', 'Initiate ConnectAB', origin)
    }
}

module.exports = Analytics
