'use strict'


/**
 * The Dialer takes care of actually dialing a phonenumber and updating
 * the status about a call.
 */
class Dialer {
    /**
     * @param {ClickToDialApp} app - The application object.
     */
    constructor(app) {
        this.app = app
        this.app.logger.debug(`${this}init`)
    }


    /**
     * Return a number trimmed from white space.
     */
    trimNumber(number) {
        // Force possible int to string.
        number = '' + number

        // Remove white space characters.
        return number.replace(/ /g, '');
    }

    /**
     * Process number to return a callable phone number.
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
     * Display a notification regarding what happened to a call.
     */
    callFailedNotification(notificationId, text) {
        let openNotificationTimeout
        if (!text) {
            notificationId = 'failed-call'
            text = this.app.translate('callFailedNotificationText')
        }

        if (window.webkitNotifications) {
            webkitNotifications.createNotification('', '', text).show()
        } else {
            let notificationCallback = () => {
                // Without clearing you can't trigger notifications with the same notificationId (quickly).
                openNotificationTimeout = setTimeout(() => {
                    this.app.browser.notifications.clear(notificationId, (wasCleared) => {})
                    clearTimeout(openNotificationTimeout)
                    openNotificationTimeout = undefined
                }, 3000)
            }
            if (openNotificationTimeout) {
                clearTimeout(openNotificationTimeout)
                openNotificationTimeout = undefined
                text = text + ' (update)'
                this.app.browser.notifications.update(notificationId, {title: text}, notificationCallback)
            } else {
                this.app.browser.notifications.create(notificationId, {
                    type: 'basic',
                    iconUrl: this.app.browser.runtime.getURL('build/img/clicktodial-big.png'),
                    title: text,
                    message: '',
                }, notificationCallback)
            }
        }
    }


    /**
     * Display a notification with a call's status.
     */
    callStatusNotification(status, b_number) {
        this.callFailedNotification('call-status', this.getStatusMessage(status, b_number))
    }


    /**
     * Setup the call between the number from the user's
     * clicktodialaccount and the `b number`; the number the user
     * wants to call..
     * @param {Number} bNumber - The number the user wants to call.
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
                this.callFailedNotification()
                return
            }

            if (this.app.api.OK_STATUS.includes(res.status)) {
                // this callid is used to find the call status, so without it: stop now
                let callid
                if (res.data) callid = res.data.callid
                if (!callid) {
                    this.callFailedNotification()
                    return
                }

                // A silent call means there won't be a visible popup informing the user of the call's status.
                // This is used  when clicking a voipaccount in the `Collegues` list.
                if (silent) {
                    // A notification will only show in case the call failed to connect both sides.
                    let silentTimerFunction = () => {
                        this.app.api.client.get(`api/clicktodial/${callid}/`).then((_res) => {
                            if (this.app.api.OK_STATUS.includes(_res.status)) {
                                const callStatus = _res.data.status
                                this.app.logger.info(`${this}clicktodial status: ${callStatus}`)
                                // Stop after receiving these statuses.
                                const statuses = ['connected', 'blacklisted', 'disconnected', 'failed_a', 'failed_b']
                                if (statuses.includes(callStatus)) {
                                    this.app.timer.stopTimer(`callstatus.status-${callid}`)
                                    this.app.timer.unregisterTimer(`callstatus.status-${callid}`)
                                    // Show status in a notification in case it fails/disconnects.
                                    if (callStatus !== 'connected') {
                                        this.callStatusNotification(callStatus, bNumber)
                                    }
                                }
                            } else if (this.app.api.NOTOK_STATUS.includes(_res.status)) {
                                // Clear interval, stop timer.
                                this.app.timer.stopTimer(`callstatus.status-${callid}`)
                                this.app.timer.unregisterTimer(`callstatus.status-${callid}`)
                            }
                        })
                    }

                    this.app.timer.registerTimer(`callstatus.status-${callid}`, silentTimerFunction)
                    this.app.timer.setInterval(`callstatus.status-${callid}`, 1500)
                    // Instant start, no need to wait for panels in the browser to be visible.
                    this.app.timer.startTimer(`callstatus.status-${callid}`)
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
                        if (this.app.timer.getRegisteredTimer(`callstatus.status-${callid}`)) {
                            this.app.api.client.get(`api/clicktodial/${callid}/`).then((_res) => {
                                if (this.app.api.OK_STATUS.includes(_res.status)) {
                                    const callStatus = _res.data.status
                                    this.app.logger.info(`${this}clicktodial status:  ${callStatus}`)

                                    // Stop after receiving these statuses.
                                    let statuses = ['blacklisted', 'disconnected', 'failed_a', 'failed_b']
                                    if (statuses.includes(callStatus)) {
                                        this.app.timer.stopTimer(`callstatus.status-${callid}`)
                                        this.app.timer.unregisterTimer(`callstatus.status-${callid}`)
                                    }
                                    // Update panel with latest status.
                                    this.app.emit('callstatus.status', {
                                        status: this.getStatusMessage(callStatus, bNumber),
                                        // Extra info to identify call.
                                        callid: callid,
                                    }, false, currentTab)
                                } else if (this.app.api.NOTOK_STATUS.includes(_res.status)) {
                                    // Clear interval, stop timer.
                                    this.app.timer.stopTimer(`callstatus.status-${callid}`)
                                    this.app.timer.unregisterTimer(`callstatus.status-${callid}`)
                                }
                            })
                        }
                    }

                    this.app.timer.registerTimer(`callstatus.status-${callid}`, timerFunction)
                    this.app.timer.setInterval(`callstatus.status-${callid}`, 1500)

                    // Tab listener.
                    this.app.on('callstatus.onshow', (data) => {
                        // Copy the number to the panel.
                        this.app.logger.debug(`${this}copy the number to the callstatus popup`)
                        this.app.emit('callstatus.b_number', {
                            b_number: bNumber,
                            // Extra info to identify call.
                            callid: callid,
                        }, false, currentTab)

                        // Copy the initial status.
                        this.app.logger.debug(`${this}copy the initial status to the callstatus popup`)
                        this.app.emit('callstatus.status', {
                            status: this.getStatusMessage(res.data.status, bNumber),
                            // Extra info to identify call.
                            callid: callid,
                        }, false, currentTab)
                    })


                    // Extra info to identify call.
                    this.app.logger.debug(`${this}extra info to identify call.`)
                    // Trigger the callstatus dialog to open.
                    this.app.emit('callstatus.show', {callid: callid}, false, currentTab)
                }
            }
        })
    }


    getStatusMessage(status, bNumber) {
        let messages = {
            'dialing_a': this.app.translate('clicktodialStatusDialingA'),
            'confirm': this.app.translate('clicktodialStatusConfirm'),
            'dialing_b': this.app.translate('clicktodialStatusDialingB', bNumber),
            'connected': this.app.translate('clicktodialStatusConnected'),
            'disconnected': this.app.translate('clicktodialStatusDisconnected'),
            'failed_a': this.app.translate('clicktodialStatusFailedA'),
            'blacklisted': this.app.translate('clicktodialStatusBlacklisted'),
            'failed_b': this.app.translate('clicktodialStatusFailedB', bNumber),
        }

        let message = this.app.translate('clicktodialCallingText');
        if (messages.hasOwnProperty(status)) {
            message = messages[status]
        }

        return message
    }


    toString() {
        return `${this.app} [Dialer]             `
    }
}


module.exports = Dialer
