'use strict'

/**
 * Run the click-to-dial app as an Electron desktop app.
 */
global._messages = require('../_locales/en/messages.json')
const ClickToDialApp = require('./lib/app')

global.app = new ClickToDialApp({
    name: 'Desktop',
    environment: {
        extension: false,
    },
})
