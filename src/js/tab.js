'use strict'

const App = require('./lib/app')
const Observer = require('./modules/dialer/observer')

require('./modules/dialer/parsers/dutch')

const _modules = [
    {name: 'dialer', Module: require('./modules/dialer')},
]


class TabsApp extends App {

    constructor(options) {
        super(options)
        this.verbose = true
    }
}

global.app = new TabsApp({
    environment: {
        extension: {
            background: false,
            popup: false,
            tab: true,
            callstatus: false,
        },
    },
    modules: _modules,
    name: 'Tabs',
})
