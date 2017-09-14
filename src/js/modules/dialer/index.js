/**
* @module Dialer
*/
const DialerActions = require('./actions')


/**
* The Dialer module. It takes care of actually dialing a phonenumber and
* updating the status about a call.
*/
class DialerModule {

    constructor(app, background = true) {
        this.app = app

        // Hardcoded blacklist of sites because there is not yet a solution
        // that works for chrome and firefox using exclude site-urls.
        //
        // These sites are blocked primarily because they are javascript-heavy
        // which in turn leads to 100% cpu usage when trying to parse all the
        // mutations for too many seconds making it not responsive.
        //
        // the content script still tracks <a href="tel:xxxx"> elements.
        this.blacklist = [
            '^chrome',
            // we prefer not to add icons in documents
            '^https?.*docs\\.google\\.com.*$',
            '^https?.*drive\\.google\\.com.*$',

            // Pages on these websites tend to grow too large to parse them in
            // a reasonable amount of time.
            '^https?.*bitbucket\\.org.*$',
            '^https?.*github\\.com.*$',
            '^https?.*rbcommons\\.com.*$',

            // This site has at least tel: support and uses javascript to open
            // a new web page when clicking the anchor element wrapping the
            // inserted icon.
            '^https?.*slack\\.com.*$',
        ]

        this.actions = new DialerActions(app, this)
    }


    /**
    * Calling this method with a provided tab will display the callstatus
    * on top of that tab in an iframe. The poller is stopped whenever the
    * callstatus dialog is closed or the returned status is final.
    * Without a provided tab(like when called from the colleagues widget)
    * there won't be a visible popup, but a html5 notification that is
    * triggered when the status changes.
    * @param {Number} bNumber - The number the user wants to call.
    * @param {Tab} [tab] - The tab from which the call was initialized,
    *                      or null to use notifcations.
    */
    async dial(bNumber, tab) {
        // Just make sure b_number is numbers only.
        bNumber = this.sanitizeNumber(bNumber).replace(/[^\d+]/g, '')
        let callid, callstatus

        // Start showing the callstatus dialog early on.
        // The actual callstatus feedback will be started after the
        // initial API requests.
        if (tab) {
            this.app.emit('dialer:status.show', {
                bNumber: bNumber,
                status: this.app.i18n.translate('clicktodialCallingText'),
            }, false, tab.id)
        } else {
            this.app.logger.notification(this.app.i18n.translate('clicktodialCallingText'))
        }

        // Get the callid from the API.
        const res = await this.app.api.client.post('api/clicktodial/', {b_number: bNumber})
        // Stop when an invalid http response is returned.
        if (this.app.api.NOTOK_STATUS.includes(res.status)) {
            this.app.logger.notification(this.app.i18n.translate('callStatusNotificationText'))
            return
        }

        // Stop when no callid is returned.
        if (!res.data || !res.data.callid) {
            this.app.logger.notification(this.app.i18n.translate('callStatusNotificationText'))
            return
        }

        callid = res.data.callid

        const callStatusPoller = async() => {
            // Get the actual callstatus from the API.
            const _res = await this.app.api.client.get(`api/clicktodial/${callid}/`)
            if (this.app.api.NOTOK_STATUS.includes(_res.status)) {
                // Something went wrong. Stop the timer.
                this.app.timer.stopTimer(`dialer:status.update-${callid}`)
                this.app.timer.unregisterTimer(`dialer:status.update-${callid}`)
                return
            }

            // Compare with the last callstatus, so we don't
            // perform unnecessary status updates.
            if (callstatus !== _res.data.status) {
                callstatus = _res.data.status

                if (tab) {
                    // Update panel on each call with latest status.
                    this.app.emit('dialer:status.update', {
                        callid: callid,
                        frame: 'callstatus',
                        status: this.getStatusMessage(callstatus, bNumber),
                    }, false, tab.id)
                } else {
                    // First hide a previous notification, so it won't stack.
                    this.app.logger.notification(this.getStatusMessage(callstatus, bNumber))
                }
            }

            // Stop the status timer when the call is in a final state..
            const resetStatus = ['blacklisted', 'disconnected', 'failed_a', 'failed_b']
            if (resetStatus.includes(callstatus)) {
                this.app.emit('dialer:status.stop', {})
                this.app.timer.stopTimer(`dialer:status.update-${callid}`)
                this.app.timer.unregisterTimer(`dialer:status.update-${callid}`)
            }
        }

        this.app.timer.registerTimer(`dialer:status.update-${callid}`, callStatusPoller)
        this.app.timer.setInterval(`dialer:status.update-${callid}`, 1500)

        if (tab) {
            // Pass the callid to the callstatus iframe. Timer will
            // be triggered by the callstatus script.
            this.app.emit('dialer:status.update', {callid: callid, frame: 'callstatus'}, false, tab.id)
        } else {
            // In notification mode, we start the timer immediatly.
            this.app.timer.startTimer(`dialer:status.update-${callid}`)
        }
    }


    getStatusMessage(status, bNumber) {
        let messages = {
            blacklisted: this.app.i18n.translate('clicktodialStatusBlacklisted'),
            confirm: this.app.i18n.translate('clicktodialStatusConfirm'),
            connected: this.app.i18n.translate('clicktodialStatusConnected'),
            dialing_a: this.app.i18n.translate('clicktodialStatusDialingA'),
            dialing_b: this.app.i18n.translate('clicktodialStatusDialingB', bNumber),
            disconnected: this.app.i18n.translate('clicktodialStatusDisconnected'),
            failed_a: this.app.i18n.translate('clicktodialStatusFailedA'),
            failed_b: this.app.i18n.translate('clicktodialStatusFailedB', bNumber),
        }

        let message = this.app.i18n.translate('clicktodialCallingText')
        if (messages.hasOwnProperty(status)) {
            message = messages[status]
        }

        return message
    }


    /**
    * Process number to return a callable phone number.
    * @param {String} number - Number to clean.
    * @returns {String} - The cleaned number.
    */
    sanitizeNumber(number) {
        number = this.trimNumber(number)

        // Make numbers like +31(0) work.
        let digitsOnly = number.replace(/[^\d]/g, '')
        if (digitsOnly.substring(0, 3) === '310') {
            if (number.substring(3, 6) === '(0)') {
                number = number.replace(/^\+31\(0\)/, '+31')
            }
        }

        return number
    }


    /**
    * A tab triggers this function to show a status dialog.
    * @param {String} bNumber - Pass it asap to the callstatus page.
    * @param {String} status - Pass the initial status to the callstatus page.
    */
    showCallstatus(bNumber, status) {
        // Inline style for the injected callstatus iframe.
        let iframeStyle = {
            height: '100vh',
            left: '0',
            position: 'fixed',
            top: '0',
            width: '100vw',
            'z-index': '2147483647',
        }

        this.frame = $('<iframe>', {
            scrolling: false,
            src: this.app.browser.runtime.getURL(`webext_callstatus.html?bNumber=${bNumber}&status=${status}`),
            style: (function() {
                // Can't set !important with
                // .css("property", "value !important"),
                // so build a string to use as style.
                let style = ''
                for (let property in iframeStyle) {
                    style += `${property}: ${iframeStyle[property]} !important; `
                }
                return style
            }()),
        })

        $(this.frame).hide().on('load', (e) => {
            $(this.frame).show()
        })
        $('html').append(this.frame)
    }


    /**
    * Determine if the DOM observer and c2d icons should be switched on
    * or off. Method is bound to the `dialer:observer.ready` event listener.
    * The callback is done to the observer script.
    * @param {Object} data - The event data.
    */
    determineObserve(data) {
        if (!data.sender.tab) return
        if (!this.app.store.get('user')) {
            this.app.logger.info(`${this}not observing because user is not logged in: ${data.sender.tab.url}`)
            data.callback({observe: false})
            return
        }

        if (!this.app.store.get('c2d')) {
            this.app.logger.info(`${this}not observing because icons are disabled: ${data.sender.tab.url}`)
            data.callback({observe: false})
            return
        }

        // Test if one of the blacklisted sites matches.
        let blacklisted = false
        for (let i = 0; i < this.blacklist.length; i++) {
            if (new RegExp(this.blacklist[i]).test(data.sender.tab.url)) {
                blacklisted = true
                break
            }
        }

        if (blacklisted) {
            this.app.logger.info(`${this}not observing because this site is blacklisted: ${data.sender.tab.url}`)
            data.callback({observe: false})
        } else {
            this.app.logger.info(`${this}observing ${data.sender.tab.url}`)
            data.callback({observe: true})
        }
    }


    toString() {
        return `${this.app}[dialer] `
    }


    /**
    * Return a number trimmed from white space.
    * @param {String} number - Number to trim.
    * @returns {String} - The whitespace trimmed number.
    */
    trimNumber(number) {
        // Force possible int to string.
        number = '' + number

        // Remove white space characters.
        return number.replace(/ /g, '')
    }


    _reset() {
        if (this.contextMenuItem) {
            this.app.browser.contextMenus.removeAll()
        }

        // Emit to each tab's running observer scripts that we don't want to
        // observe anymore.
        if (this.app.store.get('c2d')) {
            if (!this.app.env.extension) return
            this.app.browser.tabs.query({}, (tabs) => {
                tabs.forEach((tab) => {
                    // Emit all observers on the tab to stop.
                    this.app.emit('observer:stop', {frame: 'observer'}, false, tab.id)
                })
            })
        }
    }
}

module.exports = DialerModule
