'use strict'

/**
 * Run the click-to-dial app as a contentscript. The click-to-dial
 * app can be run as one, or having it's UI part and background running
 * part separated.
 */

const ClickToDialApp = require('./lib/app')

global.app = new ClickToDialApp({
    name: 'Popup',
    environment: {
        extension: {
            background: false,
            popup: true,
            tab: false,
            callstatus: false,
        },
    },
})
