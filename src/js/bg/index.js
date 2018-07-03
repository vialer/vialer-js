/**
* The Background app namespace.
* @namespace AppBackground
*/
const Api = require('./lib/api')
const App = require('../lib/app')
const Crypto = require('./lib/crypto')
const Devices = require('./lib/devices')
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

        // Allow context debugging during development.
        // Avoid leaking this global in production mode!
        if (!(process.env.NODE_ENV === 'production')) global.bg = this

        this.store = new Store(this)
        this.crypto = new Crypto(this)
        this.timer = new Timer(this)

        this.__mergeBusy = false
        this.__mergeQueue = []

        // Send the background script's state to the requesting event.
        this.on('bg:get_state', ({callback}) => {
            callback(JSON.stringify(this.state))
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
        this.emit('factory-defaults')
        if (this.env.isBrowser) location.reload()
    }


    async __init() {
        if (this.env.isBrowser) {
            // Create audio/video elements in a browser-like environment.
            // The audio element is used to playback sounds with
            // (like ringtones, dtmftones). The video element is
            // used to attach the remote WebRTC stream to.
            this.localVideo = document.createElement('video')
            this.localVideo.setAttribute('id', 'local')
            this.localVideo.muted = true

            this.remoteVideo = document.createElement('video')
            this.remoteVideo.setAttribute('id', 'remote')
            document.body.prepend(this.localVideo)
            document.body.prepend(this.remoteVideo)

            // Trigger play automatically. This is required for any audio
            // to play during a call.
            this.remoteVideo.addEventListener('canplay', () => this.remoteVideo.play())
            this.localVideo.addEventListener('canplay', () => this.localVideo.play())
        }

        // Start by initializing all modules.
        for (let module of this._modules) {
            this.modules[module.name] = new module.Module(this)
        }

        this.api = new Api(this)
        await this.__initStore()
        this.telemetry = new Telemetry(this)
        // Clear all state if the schema changed after a plugin update.
        // This is done here because of translations, which are only available
        // after initializing Vue.
        const validSchema = this.store.validSchema()
        let notification = {message: null, title: null}
        // Only send a notification when the schema is already defined and invalid.
        if (validSchema === false) {
            notification.message = this.$t('this update requires you to re-login and setup your account again; our apologies.')
            notification.title = this.$t('database schema changed')
        }

        if (!validSchema) this.__factoryDefaults(notification)
        this.emit('ready')
    }


    /**
    * Load API data and connect to the SIP backend.
    * Only use this method on an authenticated user.
    */
    __initServices() {
        this.logger.info(`${this}init connectivity services`)
        if (this.state.app.online) {
            this._platformData()
            this.modules.calls.connect()
        }

        this.setState({ui: {menubar: {event: null}}})
    }


    /**
    * Load store defaults and restore the encrypted state from
    * localStorage if the session can be restored. Load a clean state
    * from defaults otherwise. Then initialize the ViewModel and check for the
    * data schema. Do a factory reset if the data schema is outdated.
    */
    async __initStore() {
        super.__initStore()
        this.setSession('active')
        // Setup HTTP client without authentication when there is a store.
        this.api.setupClient()
        // The vault always starts in a locked position.
        this.setState({
            app: {vault: {unlocked: false}},
            ui: {menubar: {default: 'inactive'}},
        })

        // See if we can decipher the stored encrypted state when
        // there is an active vault, a key and an encrypted store.
        if (this.state.app.vault.key) {
            await this.__unlockSession({key: this.state.app.vault.key, username: this.state.user.username})
            // The API username and token are now available in the store.
            this.api.setupClient(this.state.user.username, this.state.user.token)
            this.__initServices()
        }

        this.devices = new Devices(this)

        // Each module can define watchers on store attributes, which makes
        // it easier to centralize data-related logic.
        let watchers = {}
        for (let module of Object.keys(this.modules)) {
            if (this.modules[module]._watchers) {
                this.logger.debug(`${this}adding watchers for module ${module}`)
                Object.assign(watchers, this.modules[module]._watchers())
            }
        }

        // (!) State is reactive after initializing the view-model.
        await this.__initViewModel(watchers)

        // Signal all modules that AppBackground is ready to go.
        for (let module of Object.keys(this.modules)) {
            if (this.modules[module]._ready) this.modules[module]._ready()
        }
    }


    /**
    * App state merge operation with additional optional state storage.
    * The busy flag and queue make sure that merge operations are done
    * sequently. Multiple requests can come in from events; each should
    * be processed one at a time.
    * @param {Object} options - See the parameter description of super.
    */
    async __mergeState({action = 'upsert', encrypt = true, path = null, persist = false, state}) {
        if (this.__mergeBusy) {
            this.__mergeQueue.push(() => this.__mergeState({action, encrypt, path, persist, state}))
            return
        } else if (this.__mergeQueue.length) {
            // See if a request is queued before starting.
            this.__mergeQueue.pop()()
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
        let storeKey = encrypt ? `${this.state.user.username}/state/vault` : `${this.state.user.username}/state`
        let storeState = this.store.get(storeKey)

        if (storeState) {
            if (encrypt) {
                storeState = JSON.parse(await this.crypto.decrypt(this.crypto.sessionKey, storeState))
            }
        } else storeState = {}

        // Store specific properties in a nested key path.
        if (path) {
            path = path.split('.')
            const _ref = path.reduce((o, i)=>o[i], storeState)
            this.__mergeDeep(_ref, state)
        } else {
            this.__mergeDeep(storeState, state)
        }

        // Encrypt the updated store state.
        if (encrypt) {
            storeState = await this.crypto.encrypt(this.crypto.sessionKey, JSON.stringify(storeState))
        }

        this.store.set(storeKey, storeState)
        // The method is free to process the next request.
        this.__mergeBusy = false

        // See if a request is queued before leaving.
        if (this.__mergeQueue.length) {
            this.__mergeQueue.pop()()
        }
    }


    /**
    * Unlock the vault while the application is already running.
    * @param {Object} [options] - options.
    * @param {String} [options.username] - The username to unlock the store with.
    * @param {String} [options.password] - The password to unlock the store with.
    */
    async __unlockSession({key = null, username = null, password = null} = {}) {
        if (key) {
            this.logger.info(`${this}import vault CryptoKey from stored key`)
            await this.crypto._importVaultKey(key)
        } else if (username && password) {
            this.logger.info(`${this}loading vault identity from credentials`)
            await this.crypto.loadIdentity(username, password)
        } else {
            throw new Error('Cannot unlock without session key or credentials.')
        }

        await this._restoreState(username)
        this.setState({
            app: {vault: {unlocked: true}},
            user: {authenticated: true},
        }, {encrypt: false, persist: true})

        // Set the default layer if it's still set to login.
        if (this.state.ui.layer === 'login') {
            this.setState({ui: {layer: 'calls'}}, {encrypt: false, persist: true})
        }

        this.emit('unlocked', {}, true)
    }


    /**
    * Refresh data from the API endpoints for each module.
    */
    _platformData() {
        this.logger.debug(`${this}refreshing platform api data`)
        for (let module in this.modules) {
            // Use 'load' instead of 'restore' to refresh the data on
            // browser restart.
            if (this.modules[module]._platformData) {
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
    * @param {String} sessionId - The username/session to restore the state for.
    */
    async _restoreState(sessionId) {
        this.logger.debug(`${this}restoring state for session ${sessionId}`)
        let cipherData = this.store.get(`${sessionId}/state/vault`)
        let unencryptedState = this.store.get(`${sessionId}/state`)
        if (!unencryptedState) unencryptedState = {}

        let decryptedState = {}
        // Determine if there is an encrypted state vault.
        if (cipherData) {
            this.logger.debug(`${this}restoring encrypted vault state for session ${sessionId}`)
            decryptedState = JSON.parse(await this.crypto.decrypt(this.crypto.sessionKey, cipherData))
        } else decryptedState = {}

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
    * Remove a session with a clean state.
    * @param {String} sessionId - The identifier of the session.
    */
    removeSession(sessionId) {
        this.logger.info(`${this}removing session '${sessionId}'`)
        this.store.remove(`${sessionId}/state`)
        this.store.remove(`${sessionId}/state/vault`)
        this.setSession('new')
    }


    /**
    * Reboot a session with a clean state. It can be used
    * to load a specific previously stored session, or to
    * continue the session that should be active or to
    * start a `new` session.
    * @param {String} sessionId - The identifier of the session. Set to null
    */
    setSession(sessionId = 'new') {
        let session = this.store.findSessions()
        if (sessionId === 'active') {
            sessionId = session.active ? session.active : null
            this.logger.debug(`${this}active session requested, found "${sessionId}"`)
        }

        this.logger.debug(`${this}activating session "${sessionId}"`)
        Object.assign(this.state, this._initialState())

        if (sessionId && sessionId !== 'new') {
            this.__mergeDeep(this.state, this.store.get(`${sessionId}/state`))
            // Always pin these presets, no matter what the stored setting is.
            if (this.state.app.vault.key) {
                this.state.app.vault.unlocked = true
            } else {
                this.state.app.vault.unlocked = false
                this.state.ui.menubar.default = 'lock'
            }
            Object.assign(this.state.user, {authenticated: false, username: sessionId})
        }

        this.state.app.session = session
        // Set the active session.
        if (sessionId && sessionId !== 'new') this.state.app.session.active = sessionId
        this.setState(this.state)
        this.__initMedia()
    }


    /**
    * Generate a representational name for this module. Used for logging.
    * @returns {String} - An identifier for this module.
    */
    toString() {
        return '[bg] '
    }
}

let bgOptions = {env, modules: [
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

if (env.isBrowser) {
    if (env.isExtension) {
        bgOptions.modules.push({Module: require('./modules/extension'), name: 'extension'})
        Raven.context(function() {
            this.bg = new AppBackground(bgOptions)
        })
    } else {
        global.AppBackground = AppBackground
        global.bgOptions = bgOptions
    }
} else {
    module.exports = {AppBackground, bgOptions}
}
