'use strict'

/**
 * This is the click-to-dial app that runs all scripts
 * combined, replacing all ipc messaging with local
 * event emitters. This version also runs in Electron as
 * a desktop app.
 */
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
        debugLevel: 'debug',
        environment: {
            extension: false,
        },
        i18n: require('../_locales/en/messages.json'),
        modules: _modules,
        name: 'web',
    })
})
