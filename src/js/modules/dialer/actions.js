/**
 * @module Dialer
 */
const Actions = require('../../lib/actions')

const phoneIconClassName = 'voipgrid-phone-icon'


/**
 * Actions for the Dialer module.
 */
class DialerActions extends Actions {

    _background() {
        /**
         * Emit to each tab's running observer scripts that we want to
         * observe the DOM and add icons to phonenumbers.
         */
        this.app.on('user:login.success', (data) => {
            if (this.app.store.get('c2d')) {
                // Only notify tabs in the context of an extension.
                if (!this.app.env.extension) return
                this.app.browser.tabs.query({}, (tabs) => {
                    tabs.forEach((tab) => {
                        this.app.emit('observer:start', {frame: 'observer'}, false, tab.id)
                    })
                })
            }
        })

        /**
         * Stop callstatus timer for callid when the callstatus dialog closes.
         */
        this.app.on('dialer:callstatus.onhide', (data) => {
            this.app.timer.stopTimer(`dialer:status.update-${data.callid}`)
            this.app.timer.unregisterTimer(`dialer:status.update-${data.callid}`)
        })

        /**
         * Start callstatus timer function for callid when the callstatus
         * dialog opens. The timer function updates the call status
         * periodically.
         */
        this.app.on('dialer:callstatus.onshow', (data) => {
            this.app.timer.startTimer(`dialer:status.update-${data.callid}`)
        })

        // An event from a tab page, requesting to dial a number.
        this.app.on('dialer:dial', (data) => {
            this.module.dial(data.b_number, data.sender.tab)
            this.app.analytics.trackClickToDial('Webpage')
        })


        // The observer script indicates that it's ready to observe.
        // Check if it should add icons.
        this.app.on('dialer:observer.ready', this.module.determineObserve.bind(this.module))

        // Remove all previously added context menus.
        if (this.app.env.extension) {
            this.app.browser.contextMenus.removeAll()
            // Add the context menu to dial the selected number when
            // right mouse-clicking.
            this.contextMenuItem = this.app.browser.contextMenus.create({
                title: this.app.i18n.translate('contextMenuLabel'),
                contexts: ['selection'],
                onclick: (info, tab) => {
                    this.app.modules.dialer.dial(info.selectionText, tab)
                    this.app.analytics.trackClickToDial('Webpage')
                },
            })
        }
    }


    _tab() {
        /**
         * Trigger showing the callstatus dialog.
         */
        this.app.on('dialer:callstatus.show', (data) => {
            this.module.showCallstatus(data.callid)
        })

        // Hides the callstatus popup.
        this.app.on('dialer:callstatus.hide', (data) => {
            // Re-enable the c2d icons again.
            $(`.${phoneIconClassName}`).each((i, el) => {
                $(el).attr('disabled', false)
            })

            $(this.module.frame).remove()
            delete this.module.frame
        })

        this.app.on('dialer:callstatus.onshow', (data) => {
            this.module.callid = data.callid
        })
    }


    toString() {
        return `${this.module}[actions] `
    }
}

module.exports = DialerActions
