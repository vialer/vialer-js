'use strict'

const Skeleton = require('./lib/skeleton')


class CallStatusApp extends Skeleton {

    /**
     * When the app initializes, it's already assumed to be active and open.
     */
    constructor(options) {
        super(options)
        this.verbose = true
        this.logger.info(`${this}starting application`)
        // Get the callid from the opened url.
        this.callid = window.location.href.match(/callid\=([^&]+)/)[1]

        this.on('callstatus:set_bnumber', (data) => {
            if (data.callid === this.callid) {
                this.logger.info(`${this}callstatus:set_bnumber triggered`)
                this.setText(document.getElementById('number'), data.b_number)
            }
        })

        this.on('callstatus:status.update', (data) => {
            if (data.callid === this.callid) {
                if (data.status) {
                    this.setText(document.getElementById('status'), data.status)
                }
            }
        })

        $('.voipgrid-status .close').on('click', this.hideCallstatus.bind(this))
        $(window).on('beforeunload', this.hideCallstatus.bind(this))

        // Indication to the tab parent script that it's active.
        this.emit('dialer:callstatus.onshow', {
            // Extra info to identify call.
            callid: this.callid,
        })
    }


    hideCallstatus(e) {
        this.logger.info(`${this}closing callstatus dialog`)
        this.emit('dialer:callstatus.hide', {
            callid: this.callid,
        }, false, false, parent)
    }


    setText(element, text) {
        this.logger.debug(`${this}setting status text '${text}'`)
        while (element.firstChild !== null) {
            // Remove all existing content.
            element.removeChild(element.firstChild)
        }
        element.appendChild(document.createTextNode(text))
    }
}


global.app = new CallStatusApp({
    debugLevel: 'debug',
    environment: {
        extension: {
            background: false,
            popup: false,
            tab: false,
            callstatus: true,
        },
    },
    modules: [],
    name: 'callstatus',
})
