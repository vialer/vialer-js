let env = require('../lib/env')

const Api = require('./lib/api')
const Sip = require('./lib/sip')
const App = require('../lib/app')
const Telemetry = require('./lib/telemetry')
const Timer = require('./lib/timer')


const _modules = [
    {Module: require('./availability'), name: 'availability'},
    {Module: require('./contacts'), name: 'contacts'},
    {Module: require('./dialer'), name: 'dialer'},
    {Module: require('./ui'), name: 'ui'},
    {Module: require('./user'), name: 'user'},
    {Module: require('./queues'), name: 'queues'},
]


class BackgroundApp extends App {

    constructor(options) {
        super(options)

        // Clears localstorage if the schema changed after a plugin update.
        if (!this.store.validSchema()) {
            this.modules.user.logout()
            return
        }

        // A state object that can be mutated across instances
        // using {app_name}:set_state and {app_name}:get_state emitters.
        this.on('bg:get_state', (data) => {
            this.logger.debug(`${this}returning state request`)
            // Send this script's state back to the requesting script.
            data.callback(this.state)
        })

        // Another script wants to sync this script's state.
        this.on('bg:set_state', (data) => {
            this.mergeDeep(this.state, data.state)
            if (data.persist) this.store.set('state', this.state)
        })

        // Continue last session if credentials are available.
        if (this.state.user.authenticated) {
            this.logger.info(`${this}reusing existing session from existing credentials`)

            this.getModuleApiData()

            if (this.env.isExtension) {
                browser.browserAction.setIcon({
                    path: 'img/icon-menubar-active.png',
                })
            }
        }
    }


    /**
    * Refreshes data from the API for each module.
    */
    getModuleApiData() {
        for (let module in this.modules) {
            // Use 'load' instead of 'restore' to refresh the data on
            // browser restart.
            if (this.modules[module].getApiData) {
                this.logger.debug(`${this}(re)refreshing api data for module ${module}`)
                this.modules[module].getApiData()
            }
        }
    }


    /**
    * Restore the state from localStorage or start with a state template.
    */
    initStore() {
        let stateObj = this.store.get('state')

        // Clear localstorage if the data schema changed.
        if (!this.store.validSchema() && stateObj) {
            this.modules.user.logout()
            return
        }

        if (stateObj) this.state = stateObj
        else this.state = this.getDefaultState()



        this.timer = new Timer(this)
        this.telemetry = new Telemetry(this)
        this.api = new Api(this)
        this.sip = new Sip(this)
    }


    /**
    * Set the background state and propagate it to the foreground.
    * @param {Object} state - The state to update.
    * @param {Boolean} persist - Whether to persist the changed state to localStorage.
    */
    setState(state, persist = false) {
        this.mergeDeep(this.state, state)
        if (persist) this.store.set('state', this.state)
        // Update the foreground's state with it.
        this.emit('fg:set_state', state)
    }


    /**
    * Small helper that returns the version of the app.
    * The version is inserted at buildtime from the
    * package.json file.
    * @returns {String} - The current app's version.
    */
    version() {
        return process.env.VERSION
    }
}


function initApp(initParams) {
    initParams.modules = _modules
    return new BackgroundApp(initParams)
}

// For extensions, this is an executable endpoint.
if (env.isExtension) {
    env.role.background = true
    global.app = initApp({
        environment: env,
        name: 'bg',
    })
}

module.exports = initApp
