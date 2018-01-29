const Api = require('./lib/api')
const Sip = require('./lib/sip')
const App = require('../lib/app')
const Telemetry = require('./lib/telemetry')
const Timer = require('./lib/timer')

let env = JSON.parse(JSON.stringify(require('../lib/env')))
env.role.bg = true



const _modules = [
    {Module: require('./availability'), name: 'availability'},
    {Module: require('./contacts'), name: 'contacts'},
    {Module: require('./user'), name: 'user'},
    {Module: require('./queues'), name: 'queues'},
]


class VialerBg extends App {

    constructor(options) {
        options.environment = env
        super(options)

        // this.env = env

        // Clears localstorage if the schema changed after a plugin update.
        if (!this.store.validSchema()) {
            this.modules.user.logout()
            return
        }

        // A state object that can be mutated across instances
        // using {app_name}:set_state and {app_name}:get_state emitters.
        this.on('bg:get_state', (data) => {
            // Send this script's state back to the requesting script.
            data.callback(this.state)
        })

        /**
        * Syncs state from the foreground to the background
        * while keeping Vue's reactivity system happy.
        */
        this.on('bg:set_state', this.mergeState.bind(this))

        this.on('bg:refresh_api_data', (data) => {
            this.getModuleApiData()
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


    _init() {
        super._init()
        this.initStore()
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
        super.initStore()
        let stateObj = this.store.get('state')

        // Clear localstorage if the data schema changed.
        if (!this.store.validSchema() && stateObj) {
            this.modules.user.logout()
            return
        }

        if (stateObj) {
            Object.assign(stateObj, this.state)
            this.state = stateObj
        } else Object.assign(this.state, this.getDefaultState())

        this.initVm()

        this.timer = new Timer(this)
        this.telemetry = new Telemetry(this)
        this.api = new Api(this)
        this.sip = new Sip(this)
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
    return new VialerBg(initParams)
}

// For extensions, this is an executable endpoint.
if (env.isExtension) {
    global.app = initApp({
        environment: env,
        name: 'bg',
    })
}

module.exports = initApp
