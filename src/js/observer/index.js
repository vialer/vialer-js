let env = require('../lib/env')
/**
* This is separate from the tab, because this observer is injected
* in ALL tab frames, instead of only the main page frame.
*@module observer
*/
const Skeleton = require('../lib/skeleton')

const _modules = [
    {Module: require('./observer'), name: 'observer'},
]


class ObserverApp extends Skeleton {

    constructor(options) {
        super(options)
    }
}

env.role.observer = true
global.app = new ObserverApp({
    environment: env,
    modules: _modules,
    name: 'observer',
})
