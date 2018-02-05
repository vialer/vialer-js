const Api = require('./lib/api')
const App = require('../lib/app')
const Telemetry = require('./lib/telemetry')
const Timer = require('./lib/timer')


let env = JSON.parse(JSON.stringify(require('../lib/env')))
env.role.bg = true


class BackgroundApp extends App {

    constructor(options) {
        options.environment = env
        super(options)
        this.api = new Api(this)
        this.timer = new Timer(this)

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
        this.on('bg:set_state', this.__mergeState.bind(this))

        this.on('bg:refresh_api_data', (data) => {
            this.getModuleApiData()
        })

        this.loadModules()
        this.initStore()
        // Continue last session if credentials are available.
        this.api.setupClient(this.state.user.username, this.state.user.password)


        // Clears localstorage if the schema changed after a plugin update.
        if (!this.store.validSchema()) {
            this.modules.user.logout()
            return
        }

        if (this.state.user.authenticated) {
            this.logger.info(`${this}assume authentication with existing credentials`)
            this.getModuleApiData()

            if (this.env.isExtension) {
                browser.browserAction.setIcon({path: 'img/icon-menubar-active.png'})
            }
            this.modules.calls.connect()
        }

        if (this.env.isExtension) {
            // Fired when the popup opens..
            browser.runtime.onConnect.addListener((port) => {
                for (let moduleName of Object.keys(this.modules)) {
                    if (this.modules[moduleName].onPopupAction) {
                        this.modules[moduleName].onPopupAction('open')
                    }
                }

                // Fired when the popup closes.
                port.onDisconnect.addListener((msg) => {
                    this.setState({ui: {visible: false}})
                    for (let moduleName of Object.keys(this.modules)) {
                        if (this.modules[moduleName].onPopupAction) {
                            this.modules[moduleName].onPopupAction('close')
                        }
                    }
                })
            })
        }

        this.emit('bg:popup-opened')
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
            Object.assign(this.state, stateObj)
            for (let module of Object.keys(this.modules)) {
                if (this.modules[module]._restoreState) {
                    this.modules[module]._restoreState(this.state[module])
                }
            }
        } else Object.assign(this.state, this._initialState())

        this.initViewModel()
        this.telemetry = new Telemetry(this)
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


function startApp(options) {
    options.modules = [
        {Module: require('./availability'), name: 'availability'},
        {Module: require('./contacts'), name: 'contacts'},
        {Module: require('./user'), name: 'user'},
        {Module: require('./queues'), name: 'queues'},
        {Module: require('./calls'), name: 'calls'},
    ]
    return new BackgroundApp(options)
}

// For extensions, this is an executable endpoint.
if (env.isExtension) global.app = startApp({name: 'bg'})

module.exports = startApp
