'use strict'

const Analytics = require('./analytics')
const Api = require('./api')

const Sip = require('./sip')
const Skeleton = require('./skeleton')
const Store = require('./store')
const Timer = require('./timer')


/**
 * This is the main entry point for the Firefox web extension,
 * the Chrome web extension and the Electron desktop app. It is used
 * by the extension scripts for background(bg) and popup(ui).
 */
class App extends Skeleton {

    constructor(options) {
        super(options)

        // Some caching mechanism.
        window.cache = {}

        this.store = new Store(this)
        this.timer = new Timer(this)

        // Store settings to localstorage.
        for (let key in this.settings) {
            if (this.settings.hasOwnProperty(key)) {
                if (this.store.get(key) === null) {
                    this.store.set(key, this.settings[key])
                }
            }
        }

        // Checkout the contents of localstorage.
        if (this.verbose) {
            let localStorageDump = `${this}localstorage contains...\n`
            for (let i = 0; i < localStorage.length; i++) {
                localStorageDump += `${localStorage.key(i)}=${localStorage.getItem(localStorage.key(i))}\n`
            }
            this.logger.debug(localStorageDump)
        }

        // Keep track of some notifications.
        this.store.set('notifications', {})
        // Continue last session if credentials are available.
        if (this.store.get('user') && this.store.get('username') && this.store.get('password')) {
            this.logger.info(`${this}reusing existing session from existing credentials`)
            this.reloadModules(false)

            if (this.env.extension && this.env.extension.background) {
                this.browser.browserAction.setIcon({path: 'img/call-green.png'})
            }
        }
    }


    /**
     * Setup the SIP stack, before loading any modules.
     */
    _init() {
        this.settings = {
            analyticsId: 'UA-60726618-9',
            platformUrl: 'https://partner.voipgrid.nl/',
            realm: 'websocket.voipgrid.nl',
            c2d: 'true',
        }
        if (this.env.extension) {
            // Only the background script in an extension has a sip stack.
            if (this.env.extension.background) {
                this.analytics = new Analytics(this, this.settings.analyticsId)
                this.api = new Api(this)
                this.sip = new Sip(this)
            }
        } else {
            this.api = new Api(this)
            this.sip = new Sip(this)
        }
    }


    /**
     * Reload all modules that have this method implemented.
     */
    reloadModules(update) {
        for (let module in this.modules) {
            // Use 'load' instead of 'restore' to refresh the data on browser restart.
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
     * Return the current version of the app.
     */
    version() {
        const _package = require('../../../package.json')
        return _package.version
    }
}

module.exports = App
