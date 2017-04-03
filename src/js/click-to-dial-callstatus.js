'use strict'

const App = require('./lib/app')


class CallStatusApp extends App {

    /**
     * When the app initializes, it's already assumed to be active and open.
     */
    constructor(options) {
        super(options)
        this.verbose = true
        this.logger.info(`${this} starting application`)
        // Get the callid from the opened url.
        this.callid = window.location.href.match(/callid\=([^&]+)/)[1]

        this.on('callstatus.b_number', (data) => {
            if (data.callid === this.callid) {
                this.logger.info(`${this} callstatus.b_number triggered`)
                var number = data.b_number
                var numberElement = document.getElementById('number')
                this.setText(numberElement, number)
            }
        })

        this.on('callstatus.status', (data) => {
            if (data.callid === this.callid) {
                this.logger.info(`${this} callstatus.status triggered`)
                var status = data.status
                if (status) {
                    var statusElement = document.getElementById('status')
                    this.setText(statusElement, status)
                }
            }
        })

        this.on('callstatus.hide', (data) => {
            if (data.callid === this.callid) {
                this.logger.info(`${this} callstatus.hide triggered`)
                this.hideCallstatus()
            }
        })

        $(() => {
            $('.voipgrid-status .close').on('click', this.hideCallstatus.bind(this))
        })

        $(window).unload(this.hideCallstatus.bind(this))

        // Indication to the tab script that it's active.
        // Emit to the background.
        this.emit('callstatus.onshow', {
            // Extra info to identify call.
            callid: this.callid,
        })

        // Emit to the tab script parent.
        // this.emit('callstatus.onshow', {
        //     // Extra info to identify call.
        //     callid: this.callid,
        // }, false, false, parent)
    }


    hideCallstatus(e) {
        this.logger.info(`${this} closing callstatus dialog`)
        this.emit('callstatus.hide', {
            callid: this.callid,
        }, false, false, parent)
    }


    setText(element, text) {
        this.logger.debug(`${this} set text '${text}'`)
        while (element.firstChild !== null) {
            // Remove all existing content.
            element.removeChild(element.firstChild)
        }
        element.appendChild(document.createTextNode(text))
    }


    showCallstatus(e) {

    }
}


global.app = new CallStatusApp({
    name: 'CallStatus',
    environment: {
        extension: {
            background: false,
            popup: false,
            tab: false,
            callstatus: true,
        },
    },
})
