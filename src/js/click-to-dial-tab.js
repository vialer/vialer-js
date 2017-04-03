'use strict'

const App = require('./lib/app')
const Page = require('./modules/page')
const Observer = require('./modules/page/observer')
const Walker = require('./modules/page/walker')

require('./modules/page/parsers/dutch')


class TabsApp extends App {

    constructor(options) {
        super(options)
        this.verbose = true
        this.walker = new Walker(this)
        this.observer = new Observer(this, this.walker)

        this.page = new Page(this)
        this.page.watch()
        $(() => this.observer.events())
    }
}

global.app = new TabsApp({
    name: 'Tabs',
    environment: {
        extension: {
            background: false,
            popup: false,
            tab: true,
            callstatus: false,
        },
    },
})
