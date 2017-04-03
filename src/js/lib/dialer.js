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
                    chrome.notifications.clear(notificationId, (wasCleared) => {})
                    clearTimeout(openNotificationTimeout)
                    openNotificationTimeout = undefined
                }, 3000)
            }
            if (openNotificationTimeout) {
                clearTimeout(openNotificationTimeout)
                openNotificationTimeout = undefined
                text = text + ' (update)'
                chrome.notifications.update(notificationId, {title: text}, notificationCallback)
            } else {
                chrome.notifications.create(notificationId, {
                    type: 'basic',
                    iconUrl: chrome.runtime.getURL('build/img/clicktodial-big.png'),
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
     * clicktodialaccount and b_number.
     */
    dial(b_number, tab, silent) {
        if (silent) {
            this.app.logger.info(`${this}calling ${b_number} silently`)
        } else {
            this.app.logger.info(`${this}calling ${b_number}`)
        }

        let content = {
            // Just make sure b_number is numbers only.
            b_number: this.sanitizeNumber(b_number).replace(/[^\d+]/g, ''),
        };

        this.app.api.asyncRequest(this.app.api.getUrl('clicktodial'), content, 'post', {
            onOk: (response) => {
                // this callid is used to find the call status, so without it: stop now
                if (!response.callid) {
                    this.callFailedNotification()
                    return
                }

                let callid = response.callid
                let timerSuffix = `-${callid}`

                if (silent) {
                    /**
                     * A silent call means there won't be a visible popup
                     * informing the user of the call's status. Only in case
                     * the call failed to connect both sides, a notification
                     * will show.
                     */
                    let silentTimerFunction = () => {
                        this.app.api.asyncRequest(`${this.app.api.getUrl('clicktodial')}${callid}/`, null, 'get', {
                            onOk: (_response) => {
                                this.app.logger.info(`${this}clicktodial status: ${_response.status}`)
                                // Stop after receiving these statuses.
                                const statuses = ['connected', 'blacklisted', 'disconnected', 'failed_a', 'failed_b']
                                if (statuses.includes(_response.status)) {
                                    this.app.timer.stopTimer('callstatus.status' + timerSuffix)
                                    this.app.timer.unregisterTimer('callstatus.status' + timerSuffix)
                                    // Show status in a notification in case it fails/disconnects.
                                    if (_response.status !== 'connected') {
                                        this.callStatusNotification(_response.status, b_number)
                                    }
                                }
                            },
                            onNotOk: () => {
                                // Clear interval, stop timer.
                                this.app.timer.stopTimer(`callstatus.status${timerSuffix}`)
                                this.app.timer.unregisterTimer(`callstatus.status${timerSuffix}`)
                            },
                        })
                    }

                    this.app.timer.registerTimer('callstatus.status' + timerSuffix, silentTimerFunction)
                    this.app.timer.setInterval('callstatus.status' + timerSuffix, 1500)
                    // Instant start, no need to wait for panels in the browser to be visible.
                    this.app.timer.startTimer('callstatus.status' + timerSuffix)
                } else {
                    /**
                     * A non-silent call will display the call's status
                     * in a popup in the active tab. Whenever the call
                     * couldn't connect both sides, a notification
                     * will show.
                     */
                    let current_tab = tab.id

                    // Keep updating the call status to the panel.
                    const timerFunction = () => {
                        if (this.app.timer.getRegisteredTimer(`callstatus.status${timerSuffix}`)) {
                            this.app.api.asyncRequest(`${this.app.api.getUrl('clicktodial')}${callid}/`, null, 'get', {
                                onOk: (_response) => {
                                    this.app.logger.info(`${this}clicktodial status:  ${_response.status}`)

                                    // Stop after receiving these statuses.
                                    let statuses = ['blacklisted', 'disconnected', 'failed_a', 'failed_b']
                                    if (statuses.includes(_response.status)) {
                                        this.app.timer.stopTimer(`callstatus.status${timerSuffix}`)
                                        this.app.timer.unregisterTimer(`callstatus.status${timerSuffix}`)
                                    }
                                    // Update panel with latest status.
                                    this.app.emit('callstatus.status', {
                                        status: this.getStatusMessage(_response.status, b_number),
                                        // Extra info to identify call.
                                        callid: callid,
                                    }, false, current_tab)
                                },
                                onNotOk: () => {
                                    // Clear interval, stop timer.
                                    this.app.timer.stopTimer(`callstatus.status${timerSuffix}`)
                                    this.app.timer.unregisterTimer(`callstatus.status${timerSuffix}`)
                                },
                            })
                        }
                    }

                    this.app.timer.registerTimer(`callstatus.status${timerSuffix}`, timerFunction)
                    this.app.timer.setInterval(`callstatus.status${timerSuffix}`, 1500)

                    // Tab listener.
                    this.app.on('callstatus.onshow', (data) => {
                        // Copy the number to the panel.
                        this.app.logger.debug(`${this}copy the number to the callstatus popup`)
                        this.app.emit('callstatus.b_number', {
                            b_number: b_number,
                            // Extra info to identify call.
                            callid: callid,
                        }, false, current_tab)

                        // Copy the initial status.
                        this.app.logger.debug(`${this}copy the initial status to the callstatus popup`)
                        this.app.emit('callstatus.status', {
                            status: this.getStatusMessage(response.status, b_number),
                            // Extra info to identify call.
                            callid: callid,
                        }, false, current_tab)
                    })


                    // Extra info to identify call.
                    this.app.logger.debug(`${this}extra info to identify call.`)
                    // Trigger the callstatus dialog to open.
                    this.app.emit('callstatus.show', {callid: callid}, false, current_tab)
                }
            },
            onNotOk: (response) => {
                this.callFailedNotification()
                return
            },
        })
    }


    getStatusMessage(status, b_number) {
        let messages = {
            'dialing_a': this.app.translate('clicktodialStatusDialingA'),
            'confirm': this.app.translate('clicktodialStatusConfirm'),
            'dialing_b': this.app.translate('clicktodialStatusDialingB', b_number),
            'connected': this.app.translate('clicktodialStatusConnected'),
            'disconnected': this.app.translate('clicktodialStatusDisconnected'),
            'failed_a': this.app.translate('clicktodialStatusFailedA'),
            'blacklisted': this.app.translate('clicktodialStatusBlacklisted'),
            'failed_b': this.app.translate('clicktodialStatusFailedB', b_number),
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
