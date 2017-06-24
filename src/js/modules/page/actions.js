'use strict'

const Actions = require('../../lib/actions')


class PageActions extends Actions {

    _background() {
        // The tab indicates that it's ready to observe. Check if it
        // should add the icons.
        this.app.on('page.observer.ready', this.module.toggleObserve.bind(this.module))
        this.app.on('clicktodial.dial', this.module.dial.bind(this.module))

        this.app.logger.debug(`${this}setting context menuitem`)

        // Remove all previously added context menus.
        if (this.app.browser.contextMenus) {
            this.app.browser.contextMenus.removeAll()
            // Add context menu to dial selected number.
            this.contextMenuItem = this.app.browser.contextMenus.create({
                title: this.app.i18n.translate('contextMenuLabel'),
                contexts: ['selection'],
                onclick: (info, tab) => {
                    this.app.dialer.dial(info.selectionText, tab)
                    this.app.analytics.trackClickToDial('Webpage')
                },
            })
        }
    }


    _tab() {
        /**
         * Trigger showing the callstatus dialog.
         */
        this.app.on('callstatus.show', (data) => {
            this.app.logger.debug(`${this}callstatus.show`)
            this.module.showCallstatus(data.callid)
        })

        // Hides the callstatus popup.
        this.app.on('callstatus.hide', (data) => {
            this.app.logger.debug(`${this}callstatus.hide triggered`)
            $(this.module.frame).remove()
            delete this.module.frame
        })

        this.app.on('callstatus.onshow', (data) => {
            this.app.logger.debug(`${this}callstatus.onshow triggered`)
            this.callid = data.callid
        })
    }


    toString() {
        return `${this.app} [PageActions]        `
    }
}

module.exports = PageActions
