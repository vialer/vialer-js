const Api = require('./lib/api')
const App = require('../lib/app')
const Crypto = require('./lib/crypto')
const Telemetry = require('./lib/telemetry')
const Timer = require('./lib/timer')


let env = JSON.parse(JSON.stringify(require('../lib/env')))
env.role.bg = true


/**
* The Vialer-js background is a separate process that
* continues running after the popup (frontend) is closed.
* As a webview, the background is just as volatile as
* the foreground.
*/
class AppBackground extends App {

    constructor(options) {
        options.env = env
        super(options)

        this.crypto = new Crypto(this)
        this.timer = new Timer(this)
        this.utils = require('../lib/utils')

        // Send this script's state back to the requesting script.
        this.on('bg:get_state', (data) => {
            data.callback(JSON.stringify(this.state))
        })
        this.on('bg:refresh_api_data', this._platformData.bind(this))
        this.on('bg:set_state', this.__mergeState.bind(this))
        this.__init()
    }


    /**
    * Send a notification to the user that all its data is removed
    * from the plugin and why. This is used as a quick-and-dirty replacement
    * for migrations when state structure changes between versions. It requires
    * the user to login again.
    * @param {Object} opts - Factory default options.
    * @param {String} opts.title - Notification title.
    * @param {String} opts.message - Notification body.
    */
    __factoryDefaults({title, message}) {
        this.modules.ui.notification({force: true, message, title})
        this.store.clear()
        if (this.env.isBrowser) location.reload()
        this.emit('factory-defaults')
    }


    async __init() {
        // Initialize all modules.
        for (let module of this._modules) {
            this.modules[module.name] = new module.Module(this)
        }
        // Initialize a new or existing encrypted store.
        this.api = new Api(this)

        await this.__initStore()
        this.telemetry = new Telemetry(this)

        if (this.env.isExtension) {
            this.setState({ui: {visible: false}})
            // Triggered when the popup opens.
            browser.runtime.onConnect.addListener((port) => {
                this.setState({ui: {visible: true}})
                for (let moduleName of Object.keys(this.modules)) {
                    if (this.modules[moduleName]._onPopupAction) {
                        this.modules[moduleName]._onPopupAction('open')
                    }
                }

                // Triggered when the popup closes.
                port.onDisconnect.addListener((msg) => {
                    this.setState({ui: {visible: false}})
                    for (let moduleName of Object.keys(this.modules)) {
                        if (this.modules[moduleName]._onPopupAction) {
                            this.modules[moduleName]._onPopupAction('close')
                        }
                    }
                })
            })
        } else {
            // There is no concept of a popup without an extension.
            // However, we still trigger the event to start timers
            // and such that rely on the event.
            this.setState({ui: {visible: true}})
            for (let moduleName of Object.keys(this.modules)) {
                if (this.modules[moduleName]._onPopupAction) {
                    this.modules[moduleName]._onPopupAction('open')
                }
            }
        }

        // Clear all state if the schema changed after a plugin update.
        // This is done here because of translations, which are only available
        // after initializing Vue.
        if (!this.store.validSchema()) {
            let message = this.$t('We are constantly improving this software. At the moment this requires you to re-login and setup your account again. Our apologies.')
            this.__factoryDefaults({message, title: this.$t('Database schema changed')})
        }

        this.emit('ready')
    }


    /**
    * Load store defaults and try to restore the encrypted state from
    * localStorage. Load a clean state from defaults otherwise. Then
    * initialize the ViewModel and check for the data schema. Do a factory
    * reset if the data schema is outdated. The watchers are initialized
    * on a module level and finally signal to the modules that the application
    * is ready to rumble.
    */
    async __initStore() {
        // Changing the menubar icon depends on a state watcher, which requires
        // Vue to be already initialized in order to pick up changes.
        let menubarIcon = 'inactive'

        super.__initStore()

        Object.assign(this.state, this._initialState())
        // Avaid allowing the unencrypted store to override state
        // properties from the encrypted store.
        const unencryptedState = this.store.get('state.unencrypted')
        if (typeof unencryptedState === 'object') {
            this.__mergeDeep(this.state, unencryptedState)
        }

        const encryptedState = this.store.get('state.encrypted')
        if (encryptedState) {
            if (this.state.settings.vault.active) {
                // See if we can decipher the stored encrypted state when
                // there is an active vault, a key and an encrypted store.
                if (this.state.settings.vault.key) {
                    await this.crypto._importVaultKey(this.state.settings.vault.key)
                    const decryptedState = JSON.parse(await this.crypto.decrypt(this.crypto.sessionKey, this.store.get('state.encrypted')))
                    this.setState(decryptedState)
                    this._restoreState(this.state)
                    // Authenticated again. Kickstart services.
                    this.__initServices()
                } else {
                    menubarIcon = 'lock-on'
                    this.setState({ui: {layer: 'unlock'}, user: {authenticated: false}}, {encrypt: false, persist: true})
                }
            } else {
                this.setState({ui: {layer: 'login'}, user: {authenticated: false}}, {encrypt: false, persist: true})
            }
        }

        let watchers = {}
        // Each module can define watchers on store attributes, which makes
        // it easier to centralize data-related logic.
        for (let module of Object.keys(this.modules)) {
            if (this.modules[module]._watchers) {
                Object.assign(watchers, this.modules[module]._watchers())
            }
        }

        this.initViewModel(watchers)
        // (!) State is reactive from here on.

        this.setState({ui: {menubar: {default: menubarIcon}}})

        for (let module of Object.keys(this.modules)) {
            if (this.modules[module]._ready) this.modules[module]._ready()
        }
    }


    /**
    * Load API data, setup the API and connect to the SIP backend.
    * Only execute this when the user is authenticated.
    */
    __initServices() {
        this.logger.info(`${this}init authenticated services`)
        this.api.setupClient(this.state.user.username, this.state.user.password)
        this._platformData()
        this.modules.calls.connect()
        this.setState({ui: {menubar: {default: 'active', event: null}}})
    }


    /**
    * Return the state to a stripped version without
    * loosing all of the personalized state properties.
    */
    __logoutState() {
        let _state = this._initialState()
        delete _state.app
        delete _state.user

        this.setState({
            availability: _state.availability,
            calls: _state.calls,
            contacts: _state.contacts,
            queues: _state.queues,
            settings: {
                webrtc: _state.settings.webrtc,
            },
            ui: {layer: 'login'},
            user: {password: ''},
        }, {persist: true})
    }


    /**
    * Unlock the encrypted store while the application is already running.
    * @param {String} username - The username to unlock the store with.
    * @param {String} password - The password to unlock the store with.
    */
    async __unlockVault(username, password) {
        try {
            await this.crypto.loadIdentity(username, password)
            const decryptedState = JSON.parse(await this.crypto.decrypt(this.crypto.sessionKey, this.store.get('state.encrypted')))
            decryptedState.user.password = password
            this.setState(decryptedState)
            // Clean the state after retrieving a state dump from the store.
            this._restoreState(this.state)
            // And we're authenticated again!
            this.setState({settings: {vault: {active: true, unlocked: true}}, user: {authenticated: true}}, {encrypt: false, persist: true})
            this.__initServices()
        } catch (err) {
            console.log(err)
            this.setState({user: {authenticated: false}}, {encrypt: false, persist: true})
            const message = this.$t('Failed to unlock. Please check your password.')
            this.emit('fg:notify', {icon: 'warning', message, type: 'danger'})
        }
    }


    /**
    * Refresh data from the API endpoints for each module.
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
    * Make sure that these values in the state are
    * set fresh when reviving the state.
    * @param {Store} store - The Stash store.
    */
    _restoreState(store) {
        store.notifications = []
        for (let module of Object.keys(this.modules)) {
            if (this.modules[module]._restoreState) {
                this.modules[module]._restoreState(this.state[module])
            }
        }
    }
}


function initApp(options) {
    options.modules = [
        {Module: require('./modules/app'), name: 'app'},
        {Module: require('./modules/availability'), name: 'availability'},
        {Module: require('./modules/calls'), name: 'calls'},
        {Module: require('./modules/contacts'), name: 'contacts'},
        {Module: require('./modules/settings'), name: 'settings'},
        {Module: require('./modules/queues'), name: 'queues'},
        {Module: require('./modules/ui'), name: 'ui'},
        {Module: require('./modules/user'), name: 'user'},
    ]

    // Extension-specific functionality lives in a separate module.
    if (env.isExtension) {
        options.modules.push({Module: require('./modules/extension'), name: 'extension'})
    }
    return new AppBackground(options)
}


if (!global.app) global.app = {}
global.app.bg = initApp({name: 'bg'})

module.exports = initApp
