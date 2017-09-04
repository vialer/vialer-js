const Skeleton = require('./lib/skeleton')


const _modules = [
    {Module: require('./modules/dialer'), name: 'dialer'},
]


class TabsApp extends Skeleton {

    constructor(options) {
        super(options)
        this.verbose = true
    }
}

global.app = new TabsApp({
    environment: {
        extension: {
            background: false,
            callstatus: false,
            popup: false,
            tab: true,
        },
    },
    i18n: {},
    modules: _modules,
    name: 'tab',
})
