/**
* @module Dialer
*/
const Actions = require('../../lib/actions')

const phoneIconClassName = 'vialer-icon'


/**
* Actions for the Dialer module.
*/
class DialerActions extends Actions {

    toString() {
        return `${this.module}[actions] `
    }


    _background() {
        /**
        * Emit to each tab's running observer scripts that we want to
        * observe the DOM and add icons to phonenumbers.
        */
        this.app.on('user:login.success', (data) => {
            // Only notify tabs in the context of an extension.
            if (!this.app.env.extension) return

            browser.tabs.query({}).then((tabs) => {
                tabs.forEach((tab) => {
                    if (this.module.switchObserver(tab)) {
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
            if (data.forceSilent || !this.app.env.extension) this.module.dial(data.b_number, null)
            else this.module.dial(data.b_number, data.sender.tab)
            if (data.analytics) this.app.analytics.trackClickToDial(data.analytics)
        })

        // The observer script in a frame indicates that it's ready to observe.
        // Check if it should add icons.
        if (this.app.env.extension) {
            this.app.on('dialer:observer.ready', (data) => {
                data.callback({observe: this.module.switchObserver(data.sender.tab)})
            })
        }
    }


    _tab() {
        /**
         * Trigger showing the callstatus dialog.
         */
        this.app.on('dialer:status.show', (data) => {
            this.module.showCallstatus(data.bNumber, data.status)
        })

        // The callstatus iframe informs the tab that
        // it has to be closed.
        this.app.on('dialer:status.hide', (data) => {
            // Re-enable the Vialer icons in the tab again.
            $(`.${phoneIconClassName}`).each((i, el) => {
                $(el).attr('disabled', false)
            })

            $(this.module.frame).remove()
            delete this.module.frame
            // Notify the background to stop any timer that
            // may still be running.
            this.app.emit('dialer:status.onhide', data)
        })
    }
}

module.exports = DialerActions
