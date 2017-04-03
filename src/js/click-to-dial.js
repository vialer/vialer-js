'use strict'

const App = require('./lib/app')
const Auth = require('./lib/auth')
const Analytics = require('./lib/analytics')
const Api = require('./lib/api')
const Dialer = require('./lib/dialer')
const Sip = require('./lib/sip')
const Store = require('./lib/store')
const Timer = require('./lib/timer')

const Loader = require('./modules/loader')


/**
 * This is the main entry point for the Firefox web extension,
 * the Chrome web extension and the Electron desktop app.
 */
class ClickToDialApp extends App {

    constructor(options) {
        super(options)

        // Some caching mechanism.
        window.cache = {}

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

        if (this.env.extension && !this.env.extension.tab) {
            this.api = new Api(this)
            this.auth = new Auth(this)
            this.loader = new Loader(this)
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
            this.loader.reloadModules()

            if (this.env.extension && this.env.extension.background) {
                this.logger.info(`${this}set icon to available because of login`)
                chrome.browserAction.setIcon({path: 'build/img/call-green.png'})
            }
        }
    }


    translate(messageID, args) {
        return chrome.i18n.getMessage(messageID, args)
    }


    /**
     * Return the current version of the app.
     */
    version() {
        return chrome.runtime.getManifest().version
    }
}

module.exports = ClickToDialApp
