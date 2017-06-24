'use strict'

const Analytics = require('./analytics')
const Api = require('./api')
const Dialer = require('./dialer')
const Skeleton = require('./skeleton')
const Sip = require('./sip')
const Store = require('./store')
const Timer = require('./timer')


const _modules = [
    {name: 'availability', Module: require('../modules/availability')},
    {name: 'contacts', Module: require('../modules/contacts')},
    {name: 'page', Module: require('../modules/page')},
    {name: 'ui', Module: require('../modules/ui')},
    {name: 'user', Module: require('../modules/user')},
    {name: 'queues', Module: require('../modules/queues')},
]


/**
 * This is the main entry point for the Firefox web extension,
 * the Chrome web extension and the Electron desktop app. It is used
 * by the extension scripts for background(bg) and popup(ui).
 */
class ClickToDialApp extends Skeleton {

    constructor(options) {
        super(options)

        // Some caching mechanism.
        window.cache = {}
        this.modules = {}
        this.settings = {
            analyticsId: 'UA-60726618-9',
            platformUrl: 'https://partner.voipgrid.nl/',
            realm: 'websocket.voipgrid.nl',
            c2d: 'true',
        }

        this.store = new Store(this)

        if (this.env.extension && this.env.extension.background) {
            this.sip = new Sip(this)
        }

        if (this.env.extension) {
            this.api = new Api(this)
            // Init these modules.
            for (let module of _modules) {
                this.modules[module.name] = new module.Module(this)
            }

            this.logger.debug(`${this}${this._listeners} listeners registered`)
        }

        this.analytics = new Analytics(this, this.settings.analyticsId)

        this.dialer = new Dialer(this)
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
            let localStorageDump = `${this} localstorage contains...\n`
            for (let i = 0; i < localStorage.length; i++) {
                localStorageDump += `${localStorage.key(i)}=${localStorage.getItem(localStorage.key(i))}\n`
            }
            this.logger.debug(localStorageDump)
        }

        // Keep track of some notifications.
        this.store.set('notifications', {})
        // Continue last session if credentials are available.
        if (this.store.get('user') && this.store.get('username') && this.store.get('password')) {
            this.logger.info(`${this} reusing session`)
            this.reloadModules(false)

            if (this.env.extension && this.env.extension.background) {
                this.logger.info(`${this}set icon to available because of login`)
                this.browser.browserAction.setIcon({path: 'img/call-green.png'})
            }
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


    translate(messageID, args) {
        return this.browser.i18n.getMessage(messageID, args)
    }


    /**
     * Return the current version of the app.
     */
    version() {
        return this.browser.runtime.getManifest().version
    }
}

module.exports = ClickToDialApp
