/**
* The Background app namespace.
* @namespace AppBackground
*/
const Api = require('./lib/api')
const App = require('../lib/app')
const Crypto = require('./lib/crypto')
const env = require('../lib/env')({role: 'bg'})
const Store = require('./lib/store')
const Telemetry = require('./lib/telemetry')
const Timer = require('./lib/timer')


/**
* The Vialer-js `AppBackground` is a separate running script.
* Functionality that is considered to be part of the backend
* is placed in this context because this process keeps running
* after the AppForeground (the popup) is closed (at least, when running
* the application as WebExtension). In that sense, this is a typical
* client-server model. When running as a webview, the background is just
* as volatile as the foreground, but the same concept can be used nevertheless.
* @memberof app
*/
class AppBackground extends App {
    /**
    * @param {Object} opts - Options to initialize AppBackground with.
    * @param {Object} opts.env - The environment sniffer.
    * @namespace AppBackground.modules
    */
    constructor(opts) {
        super(opts)

        this.store = new Store(this)

        this.crypto = new Crypto(this)
        this.timer = new Timer(this)

        // Send the background script's state to the requesting event.
        this.on('bg:get_state', ({callback}) => {
            // Race to the __ready flag from AppForeground.
            // Add a one-time event if AppBackground is not yet ready, which
            // releases the callback.
            if (this.__ready) callback(JSON.stringify(this.state))
            this.once('bg:get_state_ready', () => callback(JSON.stringify(this.state)))
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
        this.api = new Api(this)

        // Start by initializing all modules.
        for (let module of this._modules) {
            this.modules[module.name] = new module.Module(this)
        }

        await this.__initStore()

        this.telemetry = new Telemetry(this)
        // Clear all state if the schema changed after a plugin update.
        // This is done here because of translations, which are only available
        // after initializing Vue.
        if (!this.store.validSchema()) {
            let message = this.$t('We are constantly improving this software. At the moment this requires you to re-login and setup your account again. Our apologies.')
            this.__factoryDefaults({message, title: this.$t('Database schema changed')})
        }

        // From here on, a request to bg:get_state will be
        // dealed with properly. Finish the callback wheb
        // an AppForeground state request is pending.
        this.__ready = true
        this.emit('bg:get_state_ready')
    }


    /**
    * Load API data, setup the API and connect to the SIP backend.
    * Only execute this when the user is authenticated.
    */
    __initServices() {
        this.logger.info(`${this}init connectivity services`)
        this.api.setupClient(this.state.user.username, this.state.user.password)
        if (this.state.app.online) {
            this._platformData()
            this.modules.calls.connect()
        }

        this.setState({ui: {menubar: {event: null}}})
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
        let menubarState = 'inactive'
        super.__initStore()

        Object.assign(this.state, this._initialState())
        // Avoid allowing the unencrypted store to override state
        // properties from the encrypted store.
        const unencryptedState = this.store.get('state.unencrypted')
        if (typeof unencryptedState === 'object') this.__mergeDeep(this.state, unencryptedState)


        if (this.state.settings.vault.active) {
            // See if we can decipher the stored encrypted state when
            // there is an active vault, a key and an encrypted store.
            if (this.state.settings.vault.key) {
                const encryptedState = this.store.get('state.encrypted')
                if (encryptedState) {
                    await this.crypto._importVaultKey(this.state.settings.vault.key)
                    await this._restoreState()
                    menubarState = this.state.ui.menubar.default
                    // Kickstart services; application is ready again.
                    this.__initServices()
                } else {
                    this.logger.debug(`${this}relogin required - a key is available, but no vault found in store`)
                    // There is a vault key, but no vault to open. Relogin.
                    this.setState({
                        settings: {vault: {unlocked: false}},
                        ui: {layer: 'login'}, user: {authenticated: false},
                    }, {encrypt: false, persist: true})
                }
            } else {
                // Active vault, but no key. Ask the user for the key.
                menubarState = 'lock-on'
                this.setState({ui: {layer: 'unlock'}, user: {authenticated: false}})
            }
        } else {
            this.setState({
                settings: {vault: {unlocked: false}},
                ui: {layer: 'login'}, user: {authenticated: false},
            }, {encrypt: false, persist: true})
        }

        // Each module can define watchers on store attributes, which makes
        // it easier to centralize data-related logic.
        let watchers = {}
        for (let module of Object.keys(this.modules)) {
            if (this.modules[module]._watchers) {
                Object.assign(watchers, this.modules[module]._watchers())
            }
        }

        this.initViewModel(watchers)
        // (!) State is reactive from here on.
        this.setState({ui: {menubar: {default: menubarState}}})

        // Signal all modules that AppBackground is ready to go.
        for (let module of Object.keys(this.modules)) {
            if (this.modules[module]._ready) this.modules[module]._ready()
        }
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
            user: {password: ''},
        }, {persist: true})

        this.setState({ui: {layer: 'login'}}, {encrypt: false, persist: true})
    }


    /**
    * App state merge operation with additional optional
    * state storage for `AppBackground`.
    * @param {Object} options - See the parameter description of super.
    */
    async __mergeState({action = null, encrypt = true, path = null, persist = false, state}) {
        super.__mergeState({action, encrypt, path, persist, state})
        if (persist) {
            // Background is leading and is the only one that
            // writes to storage using encryption.
            if (encrypt) {
                let cipherDataBefore = this.store.get('state.encrypted')
                let stateClone

                if (cipherDataBefore) {
                    stateClone = JSON.parse(await this.crypto.decrypt(this.crypto.sessionKey, cipherDataBefore))
                } else {
                    stateClone = {}
                }

                this.__mergeDeep(stateClone, state)
                const cipherDataAfter = await this.crypto.encrypt(this.crypto.sessionKey, JSON.stringify(stateClone))
                this.store.set('state.encrypted', cipherDataAfter)
            } else {
                let stateClone = this.store.get('state.unencrypted')
                if (!stateClone) stateClone = {}
                this.__mergeDeep(stateClone, state)
                this.store.set('state.unencrypted', stateClone)
            }
        }
    }


    /**
    * Unlock the encrypted store while the application is already running.
    * @param {String} username - The username to unlock the store with.
    * @param {String} password - The password to unlock the store with.
    */
    async __unlockVault(username, password) {
        try {
            await this.crypto.loadIdentity(username, password)
            // Clean the state after retrieving a state dump from the store.
            await this._restoreState()
            // And we're authenticated again!
            this.setState({settings: {vault: {active: true, unlocked: true}}, user: {authenticated: true}}, {encrypt: false, persist: true})
            this.__initServices()
        } catch (err) {
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
    * The stored state are two separated serialized JSON objects.
    * One is for encrypted data, and the other for unencrypted data.
    * When the application needs to get its state together, this method
    * will restore the combined state from storage with some
    * module-specific state that needs to be (re)set when the
    * application state is being restored.
    */
    async _restoreState() {
        let cipherData = this.store.get('state.encrypted')
        let decryptedState

        if (cipherData) {
            decryptedState = JSON.parse(await this.crypto.decrypt(this.crypto.sessionKey, cipherData))
        } else decryptedState = {}

        let unencryptedState = this.store.get('state.unencrypted')
        if (!unencryptedState) unencryptedState = {}

        let state = {}
        this.__mergeDeep(state, decryptedState, unencryptedState)

        for (let module of Object.keys(this.modules)) {
            if (this.modules[module]._restoreState) {
                // Nothing persistent in this module yet. Assume an empty
                // object to start with.
                if (!state[module]) state[module] = {}
                this.modules[module]._restoreState(state[module])
            }
        }

        this.setState(state)
    }


    /**
    * Generate a representational name for this module. Used for logging.
    * @returns {String} - An identifier for this module.
    */
    toString() {
        return '[bg] '
    }
}

let options = {env, modules: [
    {Module: require('./modules/app'), name: 'app'},
    {Module: require('./modules/availability'), name: 'availability'},
    {Module: require('./modules/calls'), name: 'calls'},
    {Module: require('./modules/contacts'), name: 'contacts'},
    {Module: require('./modules/settings'), name: 'settings'},
    {Module: require('./modules/queues'), name: 'queues'},
    {Module: require('./modules/ui'), name: 'ui'},
    {Module: require('./modules/user'), name: 'user'},
]}

// Conditionally load ModuleExtension.
if (env.isExtension) {
    options.modules.push({Module: require('./modules/extension'), name: 'extension'})
}

global.bg = new AppBackground(options)


module.exports = AppBackground
