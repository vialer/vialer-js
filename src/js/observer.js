'use strict'

const Skeleton = require('./lib/skeleton')

const _modules = [
    {name: 'observer', Module: require('./modules/observer')},
]


class ObserverApp extends Skeleton {

    constructor(options) {
        super(options)
        this.verbose = true
    }
}

global.app = new ObserverApp({
    debugLevel: 'debug',
    environment: {
        extension: {
            background: false,
            popup: false,
            tab: false,
            callstatus: false,
            observer: true,
        },
    },
    modules: _modules,
    name: 'observer',
})
