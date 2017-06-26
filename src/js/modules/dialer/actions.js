'use strict'

const Actions = require('../../lib/actions')

const Observer = require('./observer')
const phoneElementClassName = 'voipgrid-phone-number'
const phoneIconClassName = 'voipgrid-phone-icon'
const Walker = require('./walker')


class DialerActions extends Actions {

    _background() {
        /**
         * Stop callstatus timer for callid when the callstatus dialog closes.
         */
        this.app.on('dialer:callstatus.onhide', (data) => {
            // We no longer need this call's status.
            let timerSuffix = `-${data.callid}`
            this.app.timer.stopTimer(`callstatus.status${timerSuffix}`)
            this.app.timer.unregisterTimer(`callstatus.status${timerSuffix}`)
        })

        /**
         * Start callstatus timer function for callid when the callstatus
         * dialog opens. The timer function updates the call status
         * periodically.
         */
        this.app.on('dialer:callstatus.onshow', (data) => {
            this.app.timer.startTimer(`dialer:callstatus.status-${data.callid}`)
        })

        // An event from a tab page, requesting to dial a number.
        this.app.on('dialer:dial', (data) => {
            this.app.modules.dialer.dial(data.b_number, data.sender.tab)
            this.app.analytics.trackClickToDial('Webpage')
        })


        // The tab indicates that it's ready to observe. Check if it should add icons.
        this.app.on('dialer:observer.ready', this.module.toggleObserve.bind(this.module))

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
        this.module.walker = new Walker(this.app)
        this.module.observer = new Observer(this.app, this.module.walker)

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

        this.app.on('dialer:observer.stop', (data) => {
            // Stop listening to DOM mutations.
            this.module.observer.stopObserver()
            // Remove icons.
            this.module.observer.undoInsert()
            // Remove our stylesheet.
            $(this.module.observer.printStyle).remove()
        })

        /**
         * Handle a click on a click-to-dial icon next to a phonenumber on a
         * page. Use the number in the attribute `data-number`.
         */
        $('body').on('click', `.${phoneIconClassName}`, (e) => {
            if (!$(e.currentTarget).attr('disabled') &&
                $(e.currentTarget).attr('data-number') &&
                $(e.currentTarget).parents(`.${phoneElementClassName}`).length
            ) {
                // Disable all c2d icons until the callstatus
                // popup is closed again.
                $(`.${phoneIconClassName}`).each((i, el) => {
                    $(el).attr('disabled', true)
                })
                $(e.currentTarget).blur()

                // Don't do anything with this click in the actual page.
                e.preventDefault()
                e.stopPropagation()
                e.stopImmediatePropagation()

                const b_number = $(e.currentTarget).attr('data-number')
                this.app.emit('dialer:dial', {
                    b_number: b_number,
                })
            }
        })

        /**
         * Click event handler: dial the number in the attribute `href`.
         */
        $('body').on('click', '[href^="tel:"]', (e) => {
            $(e.currentTarget).blur()
            // Don't do anything with this click in the actual page.
            e.preventDefault()
            e.stopPropagation()
            e.stopImmediatePropagation()

            // Dial the b_number.
            const b_number = $(e.currentTarget).attr('href').substring(4)
            this.app.emit('dialer:dial', {'b_number': b_number})
        })


        // Signal this script has been loaded and ready to look for phone numbers.
        this.app.emit('dialer:observer.ready', {
            callback: (response) => {
                // Fill the contact list.
                if (response && response.hasOwnProperty('observe')) {
                    let observe = response.observe
                    if (!observe) return

                    if (window !== window.top && !(document.body.offsetWidth > 0 || document.body.offsetHeight > 0)) {
                        // This hidden iframe might become visible, wait for this to happen.
                        $(window).on('resize', () => {
                            this.module.observer.doRun()
                            // No reason to wait for more resize events.
                            $(window).off('resize')
                        })
                    } else {
                        this.module.observer.doRun()
                    }
                }
            },
        })
    }


    toString() {
        return `${this.app} [PageActions]        `
    }
}

module.exports = DialerActions
