const App = require('../lib/app')
let env = require('../lib/env')
const utils = require('../lib/utils')


const _modules = [
    {Module: require('./availability'), name: 'availability'},
    {Module: require('./contacts'), name: 'contacts'},
    {Module: require('./user'), name: 'user'},
    {Module: require('./queues'), name: 'queues'},
]


class VialerUi extends App {

    constructor(options) {
        super(options)

        // Another script wants to sync this script's state.
        this.on('fg:set_state', (state) => {
            this.mergeDeep(this.state, state)
        })
    }


    initStore() {
        // Initialize with the initial state from the background.
        this.emit('bg:get_state', {
            callback: (state) => {
                this.state = state
                this.initVm()
                this.vm.$mount(document.querySelector('#app-placeholder'))
            },
        })
    }


    /**
    * Set the background state and propagate it to the foreground.
    * @param {Object} state - The state to update.
    * @param {Boolean} persist - Whether to persist the changed state to localStorage.
    */
    setState(state, persist = false) {
        this.mergeDeep(this.state, state)
        // Update the foreground's state with it.
        this.emit('bg:set_state', {
            persist: persist,
            state: state,
        })
    }
}


function initApp(initParams) {
    initParams.modules = _modules
    const app = new VialerUi(initParams)

    if (app.env.isChrome) $('html').addClass('chrome')
    if (app.env.isEdge) $('html').addClass('edge')
    if (app.env.isFirefox) $('html').addClass('firefox')
    return app
}


// For extensions, this is an executable endpoint.
if (env.isExtension) {
    env.role.popup = true
    let searchParams = utils.parseSearch(location.search)
    if (searchParams.popout) {
        env.role.popout = true
    }

    global.app = initApp({
        environment: env,
        name: 'fg',
    })


    navigator.mediaDevices.getUserMedia({audio: true}).then((stream) => {
        this.stream = stream
    }).catch((err) => {
        app.logger.warn(`${this}${err}`)
    })
}
module.exports = initApp
