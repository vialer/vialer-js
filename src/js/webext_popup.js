const VialerApp = require('./lib/app')

const _modules = [
    {Module: require('./modules/availability'), name: 'availability'},
    {Module: require('./modules/contacts'), name: 'contacts'},
    {Module: require('./modules/dialer'), name: 'dialer'},
    {Module: require('./modules/ui'), name: 'ui'},
    {Module: require('./modules/user'), name: 'user'},
    {Module: require('./modules/queues'), name: 'queues'},
]

global.app = new VialerApp({
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
