const Skeleton = require('./lib/skeleton')

const _modules = [
    {Module: require('./modules/observer'), name: 'observer'},
]


class ObserverApp extends Skeleton {

    constructor(options) {
        super(options)
    }
}

global.app = new ObserverApp({
    environment: {
        extension: {
            background: false,
            callstatus: false,
            observer: true,
            popup: false,
            tab: false,
        },
    },
    modules: _modules,
    name: 'observer',
})
