/**
 * Run the click-to-dial app as a contentscript. The click-to-dial
 * app can be run as one, or having it's UI part and background running
 * part separated.
 */

const ClickToDialApp = require('./lib/app')

const _modules = [
    {Module: require('./modules/availability'), name: 'availability'},
    {Module: require('./modules/contacts'), name: 'contacts'},
    {Module: require('./modules/dialer'), name: 'dialer'},
    {Module: require('./modules/ui'), name: 'ui'},
    {Module: require('./modules/user'), name: 'user'},
    {Module: require('./modules/queues'), name: 'queues'},
]

global.app = new ClickToDialApp({
    environment: {
        extension: {
            background: false,
            callstatus: false,
            popup: true,
            tab: false,
        },
    },
    modules: _modules,
    name: 'popup',
})
