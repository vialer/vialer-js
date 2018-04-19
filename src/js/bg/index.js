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

        this.__mergeBusy = false
        this.__ready = false
        // Send the background script's state to the requesting event.
        this.on('bg:get_state', ({callback}) => {
            // Race to the __ready flag from AppForeground.
            // Add a one-time event if AppBackground is not yet ready, which
            // releases the callback.
            if (this.__ready) callback(JSON.stringify(this.state))
            else this.once('bg:get_state_ready', () => callback(JSON.stringify(this.state)))
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
        if (title && message) {
            this.modules.ui.notification({force: true, message, title})
        }

        this.store.clear()
        if (this.env.isBrowser) location.reload()
        else this.emit('factory-defaults')
    }


    async __init() {
        this.api = new Api(this)
        // Create audio/video elements. The audio element is used to playback
        // sounds with (like ringtones, dtmftones). The video element is
        // used to attach the remote WebRTC stream to.
        this.audio = document.createElement('audio')
        this.video = document.createElement('video')
        document.body.prepend(this.audio)
        document.body.prepend(this.video)

        // Start by initializing all modules.
        for (let module of this._modules) {
            this.modules[module.name] = new module.Module(this)
        }

        await this.__initStore()

        this.telemetry = new Telemetry(this)
        // Clear all state if the schema changed after a plugin update.
        // This is done here because of translations, which are only available
        // after initializing Vue.
        const validSchema = this.store.validSchema()
        let notification = {message: null, title: null}
        // Only send a notification if the schema is already defined, but invalid.
        if (validSchema === false) {
            notification.message = this.$t('This update requires you to re-login and setup your account again. Our apologies.')
            notification.title = this.$t('Database schema changed')
        }

        if (!validSchema) this.__factoryDefaults(notification)


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
        super.__initStore()
        // Changing the menubar icon depends on a state watcher, which requires
        // Vue to be already initialized in order to pick up changes.
        Object.assign(this.state, this._initialState())
        // Avoid allowing the unencrypted store to override state
        // properties from the encrypted store.
        const unencryptedState = this.store.get('state.unencrypted')
        if (typeof unencryptedState === 'object') this.__mergeDeep(this.state, unencryptedState)

        // The vault always starts in a locked position, no matter what the
        // unencrypted store says.
        this.setState({
            settings: {vault: {unlocked: false}},
            ui: {menubar: {default: 'inactive'}},
        }, {encrypt: false, persist: true})

        if (this.state.settings.vault.active) {
            // See if we can decipher the stored encrypted state when
            // there is an active vault, a key and an encrypted store.
            if (this.state.settings.vault.key) {
                // Restores the user's identity.
                await this.__unlockVault({key: this.state.settings.vault.key})
                this.__initServices()
            } else {
                // Active vault, but no key. Ask the user for the key.
                this.setState({ui: {layer: 'unlock', menubar: {default: 'lock-on'}}, user: {authenticated: false}})
            }
        } else {
            this.setState({
                settings: {vault: {unlocked: false}},
                ui: {layer: 'login', menubar: {default: 'inactive'}}, user: {authenticated: false},
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
        let _initialState = this._initialState()
        delete _initialState.app
        delete _initialState.user

        this.setState({
            availability: _initialState.availability,
            calls: _initialState.calls,
            contacts: _initialState.contacts,
            queues: _initialState.queues,
            settings: {
                webrtc: _initialState.settings.webrtc,
            },
            user: {password: ''},
        }, {persist: true})

        this.setState({ui: {layer: 'login'}}, {encrypt: false, persist: true})
    }


    /**
    * App state merge operation with additional optional
    * state storage for `AppBackground`. Make sure that
    * merge operations are done sequently. This should
    * be a queue, but a polling mechanism with a timeout
    * works well enough for now.
    * @param {Object} options - See the parameter description of super.
    */
    async __mergeState({action = 'upsert', encrypt = true, path = null, persist = false, state}) {
        if (this.__mergeBusy) {
            setTimeout(() => {
                this.__mergeState({action, encrypt, path, persist, state})
            }, 1)
            return
        }

        // Flag that the operation is currently in use.
        this.__mergeBusy = true
        super.__mergeState({action, encrypt, path, persist, state})
        if (!persist) {
            this.__mergeBusy = false
            return
        }

        // Background is leading and is the only one that
        // writes to storage using encryption.
        let storageKey = encrypt ? 'state.encrypted' : 'state.unencrypted'
        let stateClone = this.store.get(storageKey)

        if (stateClone) {
            if (encrypt) {
                stateClone = JSON.parse(await this.crypto.decrypt(this.crypto.sessionKey, stateClone))
            }
        } else stateClone = {}

        // Properly store specific properties from a key path.
        if (path) {
            path = path.split('.')
            const _ref = path.reduce((o, i)=>o[i], stateClone)
            this.__mergeDeep(_ref, state)
        } else {
            this.__mergeDeep(stateClone, state)
        }

        // Encrypt the updated store state.
        if (encrypt) {
            stateClone = await this.crypto.encrypt(this.crypto.sessionKey, JSON.stringify(stateClone))
        }

        this.store.set(storageKey, stateClone)
        this.__mergeBusy = false
    }


    /**
    * Unlock the encrypted store while the application is already running.
    * @param {Object} [options] - The options to pass.
    * @param {String} [options.username] - The username to unlock the store with.
    * @param {String} [options.password] - The password to unlock the store with.
    */
    async __unlockVault({key = null, username = null, password = null} = {}) {
        if (key) {
            this.logger.info(`${this}unlocking vault with existing cryptokey`)
            await this.crypto._importVaultKey(key)
        } else if (username && password) {
            this.logger.info(`${this}unlocking vault with credentials`)
            await this.crypto.loadIdentity(username, password)
        } else {
            throw new Error('Cannot unlock without session key or credentials.')
        }

        await this._restoreState()
        this.setState({
            settings: {vault: {active: true, unlocked: true}},
            user: {authenticated: true},
        }, {encrypt: false, persist: true})

        // Set the default layer if it's still on unlock.
        if (this.state.ui.layer === 'unlock') {
            this.setState({ui: {layer: 'calls'}}, {encrypt: false, persist: true})
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
    * The stored state is separated between two serialized JSON objects
    * in localStorage. One is for encrypted data, and the other for
    * unencrypted data. When the application needs to retrieve its state
    * from storage, this method will restore the combined state
    * and applies module-specific state changes. See for instance the
    * _restoreState implementation in the Contacts module for a more
    * complicated example.
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
    {Module: require('./modules/activity'), name: 'activity'},
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
