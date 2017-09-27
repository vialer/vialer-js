const Skeleton = require('./lib/skeleton')


class CallStatusApp extends Skeleton {
    /**
    * We want to show the callstatus as soon as possible. Therefor
    * the bNumber and the initial status are already passed with
    * the opening url's query parameters.
    * @param {Object} options - Initial options to start the app with.
    */
    constructor(options) {
        super(options)
        this.logger.info(`${this}starting callstatus application`)
        // Get the callid from the opened url.
        this.bNumber = window.location.href.match(/bNumber\=([^&]+)/)[1]
        this.callid = null
        this.timerStarted = false

        let initialStatus = decodeURI(window.location.href.match(/status\=([^&]+)/)[1])

        this.setText(document.getElementById('number'), this.bNumber)
        this.setText(document.getElementById('status'), initialStatus)

        this.on('dialer:status.update', (data) => {
            // The callid is assigned on the first status update.
            if (!this.callid) this.callid = data.callid
            if (!this.timerStarted) {
                // Notify the background to start the callstatus timer.
                this.emit('dialer:status.start', {
                    // Extra info to identify call.
                    bNumber: this.bNumber,
                    callid: this.callid,
                })
                this.timerStarted = true
            }

            if (data.callid === this.callid) {
                if (data.status) {
                    this.setText(document.getElementById('status'), data.status)
                }
            }
        })

        $('.callstatus .close').on('click', this.hideCallstatus.bind(this))
        $(window).on('unload', this.hideCallstatus.bind(this))
    }


    hideCallstatus(e) {
        this.logger.info(`${this}closing callstatus dialog`)
        // Notify the parent tab that the callstatus
        // wants to be closed.
        this.emit('dialer:status.hide', {
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
    environment: {
        extension: {
            background: false,
            callstatus: true,
            popup: false,
            tab: false,
        },
    },
    modules: [],
    name: 'callstatus',
})
