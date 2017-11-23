let env = require('../lib/env')
const utils = require('../lib/utils')
const Skeleton = require('../lib/skeleton')


const _modules = [
    {Module: require('./availability'), name: 'availability'},
    {Module: require('./contacts'), name: 'contacts'},
    {Module: require('./ui'), name: 'ui'},
    {Module: require('./user'), name: 'user'},
    {Module: require('./queues'), name: 'queues'},
]


class PopupApp extends Skeleton {

    constructor(options) {
        super(options)
    }
}


function initApp(initParams) {
    initParams.modules = _modules
    return new PopupApp(initParams)
}


// For extensions, this is an executable endpoint.
if (env.isExtension) {
    env.role.popup = true
    let searchParams = utils.parseSearch(location.search)
    if (searchParams.popout) env.role.popout = true

    global.app = initApp({
        environment: env,
        name: 'popup',
    })
}
module.exports = initApp
