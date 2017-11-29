let env = require('../lib/env')

const Analytics = require('./lib/analytics')
const Api = require('./lib/api')
const Sip = require('./lib/sip')
const Skeleton = require('../lib/skeleton')
const Timer = require('./lib/timer')


const _modules = [
    {Module: require('./availability'), name: 'availability'},
    {Module: require('./contacts'), name: 'contacts'},
    {Module: require('./dialer'), name: 'dialer'},
    {Module: require('./ui'), name: 'ui'},
    {Module: require('./user'), name: 'user'},
    {Module: require('./queues'), name: 'queues'},
]


class BackgroundApp extends Skeleton {

    constructor(options) {
        super(options)

        // Keep track of some notifications.
        this.store.set('notifications', {})

        // Make application settings persistent.
        const nonPersistent = ['analyticsId']
        for (let key in this.settings) {
            if (!nonPersistent.includes(key)) {
                if (this.store.get(key) === null) {
                    this.store.set(key, this.settings[key])
                }
            }
        }

        // Clears localstorage if the schema changed after a plugin update.
        if (!this.store.validSchema()) {
            this.modules.user.logout()
            return
        }

        // Continue last session if credentials are available.
        if (this.store.get('user') && this.store.get('username') && this.store.get('password')) {
            this.logger.info(`${this}reusing existing session from existing credentials`)
            this.reloadModules(false)

            if (this.env.isExtension && this.env.role.background) {
                browser.browserAction.setIcon({path: 'img/icon-menubar-active.png'})
            }
        }
    }


    /**
    * Setup the SIP stack, before loading any modules.
    */
    _init() {
        this.settings = {
            analyticsId: process.env.ANALYTICS_ID,
            c2d: 'true',
            platformUrl: this.getPlatformUrl(),
            realm: this.getWebsocketUrl(),
        }
        this.timer = new Timer(this)
        this.analytics = new Analytics(this, this.settings.analyticsId)
        this.api = new Api(this)
        this.sip = new Sip(this)
    }


    /**
    * Get platform URL from storage or set default.
    * @returns {String} - The cleaned up API endpoint url.
    */
    getPlatformUrl() {
        let platformUrl = this.store.get('platformUrl')

        if (!platformUrl) {
            // Set a default platform url from the brand when it's not set.
            platformUrl = process.env.PLATFORM_URL
            this.store.set('platformUrl', platformUrl)
        }

        // Force trailing slash.
        if (platformUrl && platformUrl.length && platformUrl.lastIndexOf('/') !== platformUrl.length - 1) {
            platformUrl = platformUrl + '/'
        }

        return platformUrl
    }


    /**
    * Get realm websocket URL from brand settings or set default.
    * @returns {String} - The websocket URL.
    */
    getWebsocketUrl() {
        let websocketUrl = this.store.get('realm')

        if (!websocketUrl) {
            // Set a default websocket url from the brand when it's not set.
            websocketUrl = process.env.SIP_ENDPOINT
            this.store.set('realm', websocketUrl)
        }

        return websocketUrl
    }


    /**
     * Check to see if the basic auth credentials are all available.
     * @returns {Boolean} - True if username and password are present.
     */
    hasCredentials() {
        if (this.store.get('user') && this.store.get('username') && this.store.get('password')) {
            return true
        }
        return false
    }


    /**
    * Restore the state from localStorage or start with a state template.
    */
    initStore() {
        let stateObj = this.store.get('state')
        if (stateObj) this.state = stateObj
        else this.state = this.getDefaultState()

        // Clears localstorage if the schema changed after a plugin update.
        if (!this.store.validSchema()) {
            this.modules.user.logout()
            return
        }
    }


    /**
    * Reload all modules that have this method implemented.
    * @param {Boolean} update - Module indicator to update instead of (re)load.
    */
    reloadModules(update) {
        for (let module in this.modules) {
            // Use 'load' instead of 'restore' to refresh the data on
            // browser restart.
            if (this.modules[module]._load) {
                this.logger.debug(`${this}(re)loading module ${module}`)
                this.modules[module]._load(update)
            }
        }
        this.logger.debug(`${this}${this._listeners} listeners registered`)
    }


    /**
    * Restore all modules that have this method implemented.
    */
    restoreModules() {
        for (let module in this.modules) {
            if (this.modules[module]._restore) {
                this.logger.debug(`${this}restoring module ${module}`)
                this.modules[module]._restore()
            }
        }
    }


    /**
    * Reset all modules that have this method implemented.
    */
    resetModules() {
        for (let module in this.modules) {
            this.logger.debug(`${this}resetting module ${module}`)
            if (this.modules[module]._reset) {
                this.modules[module]._reset()
            }
        }
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
