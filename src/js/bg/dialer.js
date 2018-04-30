/**
* The Dialer module. It takes care of actually dialing a phonenumber and
* updating the status about a call.
* @module Dialer
*/
class DialerModule {

    constructor(app, background = true) {
        this.app = app
        this.hasUI = false
        this._contextMenuItem = null
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

        this.addListeners()
        this.addContextMenuItem()
    }


    /**
     * Add a right-click contextmenu item to all browser tabs.
     */
    addContextMenuItem() {
        this.app.logger.info(`${this}adding contextmenu`)
        this._contextMenuItem = browser.contextMenus.create({
            contexts: ['selection'],
            onclick: (info, _tab) => {
                this.app.modules.dialer.dial(info.selectionText, _tab)
                this.app.analytics.telemetryEvent('Calls', 'Initiate ConnectAB', 'Webpage')
            },
            title: this.app.i18n.translate('contextMenuLabel'),
        })
    }


    addListeners() {
        /**
        * Emit to each tab's running observer scripts that we want to
        * observe the DOM and add icons to phonenumbers.
        */
        this.app.on('user:login.success', (data) => {
            // Only notify tabs in the context of an extension.
            if (!this.app.env.isExtension) return

            browser.tabs.query({}).then((tabs) => {
                tabs.forEach((tab) => {
                    if (this.switchObserver(tab)) {
                        this.app.emit('observer:start', {frame: 'observer'}, false, tab.id)
                    }
                })
            })
        })


        /**
        * The callstatus dialog is closed. We don't longer poll
        * the callstatus of the current call.
        */
        this.app.on('dialer:status.onhide', (data) => {
            if (this.app.timer.getRegisteredTimer(`dialer:status.update-${data.callid}`)) {
                this.app.timer.stopTimer(`dialer:status.update-${data.callid}`)
                this.app.timer.unregisterTimer(`dialer:status.update-${data.callid}`)
            }
        })


        /**
        * Start callstatus timer function for callid when the callstatus
        * dialog opens. The timer function updates the call status
        * periodically. Check the `dial` method in `dialer/index.js` method
        * for the used timer function.
        */
        this.app.on('dialer:status.start', (data) => {
            this.app.timer.startTimer(`dialer:status.update-${data.callid}`)
        })


        /**
        * Used to make the actual call. A callstatus popup will be used if
        * the sender is a tab; otherwise fall back to html5 notifications.
        * Silent mode can be forced by passing the `forceSilent` Boolean
        * with the event.
        */
        this.app.on('dialer:dial', (data) => {
            if (data.forceSilent || !this.app.env.isExtension) this.dial(data.b_number, null)
            else this.dial(data.b_number, data.sender.tab)
            if (data.analytics) {
                this.app.analytics.telemetryEvent('Calls', 'Initiate ConnectAB', data.analytics)
            }
        })

        // The observer script in a frame indicates that it's ready to observe.
        // Check if it should add icons.
        if (this.app.env.isExtension) {
            this.app.on('dialer:observer.ready', (data) => {
                data.callback({observe: this.switchObserver(data.sender.tab)})
            })
        }
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
        const failedStatus = ['blacklisted', 'disconnected', 'failed_a', 'failed_b']
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
            this.app.emit('dialer:status.stop', {})
            this.app.logger.notification(this.app.i18n.translate('callStatusNotificationText'))
            return
        }

        // Stop when no callid is returned.
        if (!res.data || !res.data.callid) {
            this.app.emit('dialer:status.stop', {})
            this.app.logger.notification(this.app.i18n.translate('callStatusNotificationText'))
            return
        }

        callid = res.data.callid

        const callStatusPoller = async() => {
            // Get the actual callstatus from the API.
            const _res = await this.app.api.client.get(`api/clicktodial/${callid}/`)

            if (this.app.api.NOTOK_STATUS.includes(_res.status)) {
                this.app.emit('dialer:status.stop', {})
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
                    if (failedStatus.includes(callstatus)) {
                        this.app.logger.notification(this.getStatusMessage(callstatus, bNumber), 'Vialer', false, 'warning')
                    } else {
                        this.app.logger.notification(this.getStatusMessage(callstatus, bNumber))
                    }

                }
            }

            // Stop the status timer when the call is in a final state.
            if (failedStatus.includes(callstatus)) {
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


    removeContextMenuItem() {
        this._contextMenuItem = null
        browser.contextMenus.removeAll()
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
    * Called when the tab observer is initialized, by calling
    * `dialer:observer.ready` on the background. Determines whether the
    * DOM observer and c2d icons should be switched on or off.
    * The callback is done to the observer script.
    * @param {Object} tab - The tab that is requesting observer status.
    * @returns {Boolean} - Whether the observer should be listening.
    */
    switchObserver(tab) {
        if (!this.app.store.get('token')) {
            this.app.logger.info(`${this}not observing because user is not logged in`)
            this.removeContextMenuItem()
            return false
        }

        // Add the context menu to dial the selected number when
        // right mouse-clicking. Thqe contextmenu is available, even when
        // c2d icons are disabled. Also, this can't be switched per tab,
        // so don't take blacklisted tabs in account.
        if (!this._contextMenuItem) this.addContextMenuItem()

        if (!this.app.store.get('c2d')) {
            this.app.logger.info(`${this}not observing because icons are disabled`)
            return false
        }

        // Test if one of the blacklisted sites matches.
        let blacklisted = false
        for (let i = 0; i < this.blacklist.length; i++) {
            if (new RegExp(this.blacklist[i]).test(tab.url)) {
                blacklisted = true
                break
            }
        }

        if (blacklisted) {
            this.app.logger.info(`${this}not observing because this site is blacklisted: ${tab.url}`)
            return false
        }

        return true
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
        if (!this.app.env.isExtension) return
        // Called when logging the plugin out. Remove the contextmenu item.
        if (this._contextMenuItem) this.removeContextMenuItem()
        // Emit to each tab's running observer scripts that we don't want to
        // observe anymore.
        if (this.app.store.get('c2d')) {
            browser.tabs.query({}).then((tabs) => {
                tabs.forEach((tab) => {
                    // Emit all observers on the tab to stop.
                    this.app.emit('observer:stop', {frame: 'observer'}, false, tab.id)
                })
            })
        }
    }
}

module.exports = DialerModule
