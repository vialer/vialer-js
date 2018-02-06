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

        // Clear all state if the schema changed after a plugin update.
        if (!this.store.validSchema()) {
            this.store.remove('state')
            // Do a hard reload; nothing to save from there.
            location.reload()
        }

        this.timer = new Timer(this)

        // Send this script's state back to the requesting script.
        this.on('bg:get_state', (data) => data.callback(this.state))
        this.on('bg:refresh_api_data', this._platformData.bind(this))
        this.on('bg:set_state', this.__mergeState.bind(this))

        this.loadModules()
        this.initStore()

        this.api = new Api(this)
        this.telemetry = new Telemetry(this)

        this.api.setupClient(this.state.user.username, this.state.user.password)
        // Continue last session if credentials are available.
        if (this.state.user.authenticated) {
            this.logger.info(`${this}assume authentication with existing credentials`)
            this._platformData()

            if (this.env.isExtension) {
                browser.browserAction.setIcon({path: 'img/icon-menubar-active.png'})
            }
            this.modules.calls.connect()
        }

        if (this.env.isExtension) {
            // Fired when the popup opens..
            browser.runtime.onConnect.addListener((port) => {
                for (let moduleName of Object.keys(this.modules)) {
                    if (this.modules[moduleName]._onPopupAction) {
                        this.modules[moduleName]._onPopupAction('open')
                    }
                }

                // Fired when the popup closes.
                port.onDisconnect.addListener((msg) => {
                    this.setState({ui: {visible: false}})
                    for (let moduleName of Object.keys(this.modules)) {
                        if (this.modules[moduleName]._onPopupAction) {
                            this.modules[moduleName]._onPopupAction('close')
                        }
                    }
                })
            })
        }
    }


    /**
    * Refreshes data from the API for each module.
    */
    _platformData() {
        for (let module in this.modules) {
            // Use 'load' instead of 'restore' to refresh the data on
            // browser restart.
            if (this.modules[module]._platformData) {
                this.logger.debug(`${this}(re)refreshing api data for module ${module}`)
                this.modules[module]._platformData()
            }
        }
    }


    /**
    * Restore the state from localStorage or start with a state template.
    */
    initStore() {
        super.initStore()
        let stateObj = this.store.get('state')
        if (stateObj) {
            Object.assign(this.state, stateObj)
            this._restoreState(this.state)

            for (let module of Object.keys(this.modules)) {
                if (this.modules[module]._restoreState) {
                    this.modules[module]._restoreState(this.state[module])
                }
            }
        } else Object.assign(this.state, this._initialState())

        this.initViewModel()
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
        {Module: require('./settings'), name: 'settings'},
        {Module: require('./calls'), name: 'calls'},
    ]
    return new BackgroundApp(options)
}

// For extensions, this is an executable endpoint.
if (env.isExtension) global.app = startApp({name: 'bg'})

module.exports = startApp
