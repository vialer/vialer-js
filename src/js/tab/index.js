let env = require('../lib/env')
const Skeleton = require('../lib/skeleton')


const _modules = [
    {Module: require('./dialer'), name: 'dialer'},
]


class TabsApp extends Skeleton {

    constructor(options) {
        super(options)
    }
}


env.role.tab = true
global.app = new TabsApp({
    environment: env,
    i18n: {},
    modules: _modules,
    name: 'tab',
})
