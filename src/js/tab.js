'use strict'

const Skeleton = require('./lib/skeleton')


const _modules = [
    {name: 'dialer', Module: require('./modules/dialer')},
]


class TabsApp extends Skeleton {

    constructor(options) {
        super(options)
        this.verbose = true
    }
}

global.app = new TabsApp({
    debugLevel: 'debug',
    environment: {
        extension: {
            background: false,
            popup: false,
            tab: true,
            callstatus: false,
        },
    },
    modules: _modules,
    name: 'tab',
})
