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
    * Setup the call between the number from the user's
    * clicktodialaccount and the `b number`; the number the user
    * wants to call..
    * @param {Number} bNumber - The number the user wants to call.
    * @param {Tab} tab - The tab from which the call was initialized.
    * @param {Boolean} silent - Used when a call is done without having
    * a status dialog.
    */
    dial(bNumber, tab, silent) {
        // Just make sure b_number is numbers only.
        bNumber = this.sanitizeNumber(bNumber).replace(/[^\d+]/g, '')
        if (silent) {
            this.app.logger.info(`${this}calling ${bNumber} silently`)
        } else {
            this.app.logger.info(`${this}calling ${bNumber}`)
        }

        this.app.api.client.post('api/clicktodial/', {b_number: bNumber}).then((res) => {
            if (this.app.api.NOTOK_STATUS.includes(res.status)) {
                this.app.logger.notification(this.app.i18n.translate('callStatusNotificationText'))
                return
            }

            if (this.app.api.OK_STATUS.includes(res.status)) {
                // This callid is used to find the call status,
                // so without it: stop now.
                let callid
                if (res.data) callid = res.data.callid
                if (!callid) {
                    this.app.logger.notification(this.app.i18n.translate('callStatusNotificationText'))
                    return
                }

                // A silent call means there won't be a visible popup informing
                // the user of the call's status. This is used when clicking a
                // voipaccount in the `Collegues` list.
                if (silent) {
                    // A notification will only show in case the call failed to
                    // connect both sides.
                    let silentTimerFunction = () => {
                        this.app.api.client.get(`api/clicktodial/${callid}/`).then((_res) => {
                            if (this.app.api.OK_STATUS.includes(_res.status)) {
                                const callStatus = _res.data.status
                                this.app.logger.debug(`${this}clicktodial status: ${callStatus}`)
                                // Stop after receiving these statuses.
                                const statuses = ['connected', 'blacklisted', 'disconnected', 'failed_a', 'failed_b']
                                // Show status in a notification in case it
                                // fails/disconnects.
                                this.app.logger.notification(this.getStatusMessage(callStatus, bNumber))
                                if (statuses.includes(callStatus)) {
                                    this.app.timer.stopTimer(`dialer:status.update-${callid}`)
                                    this.app.timer.unregisterTimer(`dialer:status.update-${callid}`)
                                }
                            } else if (this.app.api.NOTOK_STATUS.includes(_res.status)) {
                                // Clear interval, stop timer.
                                this.app.timer.stopTimer(`dialer:status.update-${callid}`)
                                this.app.timer.unregisterTimer(`dialer:status.update-${callid}`)
                            }
                        })
                    }

                    this.app.timer.registerTimer(`dialer:status.update-${callid}`, silentTimerFunction)
                    this.app.timer.setInterval(`dialer:status.update-${callid}`, 1500)
                    // Instant start, no need to wait for panels in
                    // the browser to be visible.
                    this.app.timer.startTimer(`dialer:status.update-${callid}`)
                } else {
                    /**
                     * A non-silent call will display the call's status
                     * in a popup in the active tab. Whenever the call
                     * couldn't connect both sides, a notification
                     * will show.
                     */
                    const currentTab = tab.id

                    // Keep updating the call status to the panel.
                    const timerFunction = () => {
                        if (this.app.timer.getRegisteredTimer(`dialer:status.update-${callid}`)) {
                            this.app.api.client.get(`api/clicktodial/${callid}/`).then((_res) => {
                                if (this.app.api.OK_STATUS.includes(_res.status)) {
                                    const callStatus = _res.data.status
                                    this.app.logger.info(`${this}clicktodial status:  ${callStatus}`)

                                    // Stop after receiving these statuses.
                                    let statuses = ['blacklisted', 'disconnected', 'failed_a', 'failed_b']
                                    if (statuses.includes(callStatus)) {
                                        this.app.timer.stopTimer(`dialer:status.update-${callid}`)
                                        this.app.timer.unregisterTimer(`dialer:status.update-${callid}`)
                                    }
                                    // Update panel with latest status.
                                    this.app.emit('callstatus:status.update', {
                                        callid: callid,
                                        frame: 'callstatus',
                                        status: this.getStatusMessage(callStatus, bNumber),
                                        // Extra info to identify call.
                                    }, false, currentTab)
                                } else if (this.app.api.NOTOK_STATUS.includes(_res.status)) {
                                    // Clear interval, stop timer.
                                    this.app.timer.stopTimer(`dialer:status.update-${callid}`)
                                    this.app.timer.unregisterTimer(`dialer:status.update-${callid}`)
                                }
                            })
                        }
                    }

                    this.app.timer.registerTimer(`dialer:status.update-${callid}`, timerFunction)
                    this.app.timer.setInterval(`dialer:status.update-${callid}`, 1500)

                    // Tab listener.
                    this.app.on('dialer:callstatus.onshow', (data) => {
                        // Copy the number to the panel.
                        this.app.logger.debug(`${this}copy the number to the callstatus popup`)
                        this.app.emit('callstatus:set_bnumber', {
                            b_number: bNumber,
                            // Extra info to identify call.
                            callid: callid,
                            frame: 'callstatus',
                        }, false, currentTab)

                        // Copy the initial status.
                        this.app.logger.debug(`${this}copy the initial status to the callstatus popup`)
                        this.app.emit('callstatus:status.update', {
                            callid: callid,
                            frame: 'callstatus',
                            status: this.getStatusMessage(res.data.status, bNumber),
                            // Extra info to identify call.
                        }, false, currentTab)
                    })


                    // Extra info to identify call.
                    this.app.logger.debug(`${this}extra info to identify call.`)
                    // Trigger the callstatus dialog to open.
                    this.app.emit('dialer:callstatus.show', {
                        b_number: bNumber,
                        callid: callid,
                    }, false, currentTab)
                }
            }
        })
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
    * Hide panel when clicking outside the iframe.
    * @param {String} callid - Call id for the frame to remove.
    */
    hideFrameOnClick(callid) {
        $(this.frame).remove()
        delete this.frame
        this.app.emit('dialer:callstatus.onhide', {
            // Extra info to identify call.
            callid: callid,
        })
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
    * A tab triggers this function to show a status dialog. The callid is
    * passed to the iframe page using a search string.
    * @param {String} callid - The call id is passed to callstatus popup.
    */
    showCallstatus(callid) {
        // Inline style for the injected callstatus iframe.
        let iframeStyle = {
            background: '#fff',
            border: 'none',
            'border-radius': '5px',
            bottom: '0',
            'box-shadow': 'rgba(0,0,0,0.25) 0 0 0 2038px, rgba(0,0,0,0.25) 0 10px 20px',
            height: '79px',
            left: '0',
            margin: 'auto',
            'min-height': '0',
            position: 'fixed',
            right: '0',
            top: '0',
            width: '320px',
            'z-index': '2147483647',
        }

        this.frame = $('<iframe>', {
            scrolling: false,
            src: this.app.browser.runtime.getURL(`webext_callstatus.html?callid=${callid}`),
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

        $('html').on('click', this.hideFrameOnClick.bind(this, callid))
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
