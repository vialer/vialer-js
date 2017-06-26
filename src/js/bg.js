'use strict'

/**
 * Run the click-to-dial app as a contentscript. The click-to-dial
 * app can be run as one, or having it's UI part and background running
 * part separated.
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

global.app = new ClickToDialApp({
    modules: _modules,
    name: 'Background',
    environment: {
        extension: {
            background: true,
            popup: false,
            tab: false,
            callstatus: false,
        },
    },
})
