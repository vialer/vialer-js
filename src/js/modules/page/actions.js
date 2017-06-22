'use strict'

const Actions = require('../../lib/actions')


class PageActions extends Actions {

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
