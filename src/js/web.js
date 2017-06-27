'use strict'

/**
 * Run the click-to-dial app as an Electron desktop app.
 */
// global._messages = require('../_locales/en/messages.json')
const ClickToDialApp = require('./lib/app')

const _modules = [
    {name: 'availability', Module: require('./modules/availability')},
    {name: 'contacts', Module: require('./modules/contacts')},
    {name: 'dialer', Module: require('./modules/dialer')},
    {name: 'ui', Module: require('./modules/ui')},
    {name: 'user', Module: require('./modules/user')},
    {name: 'queues', Module: require('./modules/queues')},
]

document.addEventListener('DOMContentLoaded', () => {
    global.app = new ClickToDialApp({
        environment: {
            extension: false,
        },
        modules: _modules,
        name: 'WebApp',
    })
})
