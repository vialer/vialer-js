'use strict'

const EventEmitter = require('events').EventEmitter
const Logger = require('./logger')
const Store = require('./store')

/**
 * This is the minimal App class that all parts of the click-to-dial
 * application use(tab, contentscript, background and popout). It sets
 * some basic properties that can be reused, like a logger, a basic
 * eventemitter and some environmental properties.
 */
class Skeleton extends EventEmitter {

    constructor(options) {
        super()
        this._listeners = 0
        this.name = options.name

        this.store = new Store(this)
        this.utils = require('./utils')

        // Increases verbosity beyond the logger's debug level.
        this.verbose = false
        this.logger = new Logger()
        // Sets the verbosity of the logger.
        this.logger.setLevel('debug')
        this.logger.debug(`${this} init`)
        this.env = this.getEnvironment(options.environment)

        // If browser exists, use browser, otherwise take the Chrome API.
        if ('browser' in global) {
            this.browser = browser
        } else {
            this.browser = chrome
        }

        if (this.browser.extension) {
            // Make the EventEmitter .on method compatible with web extension ipc.
            // An Ipc event is coming in. Map it to the EventEmitter.
            this.browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
                if (this.verbose) this.logger.debug(`${this}${request.event} triggered`)
                if (request.data) {
                    // Add extra contextual information about sender to the payload.
                    request.data.sender = sender
                    // It may have a callback, but functions can't pass through
                    // the request.data, so map sendResponse.
                    request.data.callback = sendResponse
                }
                this.emit(request.event, request.data, true)
            })

            // Allows parent scripts to use the same EventEmitter syntax.
            if (this.env.extension && this.env.extension.tab) {
                this.logger.info(`${this} added plain message listener`)
                window.addEventListener('message', (e) => {
                    if (this.verbose) this.logger.debug(`${this}${e.data.event} triggered`)
                    this.emit(e.data.event, e.data.data, true)
                })
            }
        }
    }


    /**
     * Modified emit method which makes it compatible with web extension ipc.
     * Without tabId or parent, the event is emitted on the runtime, which
     * includes listeners for the popout and the background script. The tabId
     * or the parent are specific when an event needs to be emitted on
     * either a tab content script or from a loaded tab content script to
     * it's parent.
     */
    emit(event, data = {}, skipExtension = false, tabId = false, parent = false) {
        if (this.verbose) this.logger.debug(`${this} emit ${event}`)
        if (this.browser.extension && !skipExtension) {
            let payloadArgs = []
            let payloadData = {event: event, data: data}
            payloadArgs.push(payloadData)

            if (tabId) {
                this.browser.tabs.sendMessage(tabId, payloadData)
                return
            } else if (parent) {
                parent.postMessage({
                    event: event,
                    data: data,
                }, '*')
                return
            }

            if (data && data.callback) {
                payloadArgs.push(data.callback)
            }
            this.browser.runtime.sendMessage(...payloadArgs)
        } else {
            super.emit(event, data)
        }
    }


    /**
     * Sets environmental properties, used to distinguish between
     * webextension, regular webapp or Electron app.
     * @param {Object} environment - The environment properties passed to the Constructor.
     */
    getEnvironment(environment) {
        if (environment.extension) {
            let searchParams = this.utils.parseSearch(location.search)
            if (searchParams.popout) {
                environment.extension.popout = true
            } else {
                environment.extension.popout = false
            }
            if (global.chrome) {
                environment.extension.isChrome = true
                environment.extension.isFirefox = false
            } else {
                environment.extension.isChrome = false
                environment.extension.isFirefox = true
            }
        }

        return environment
    }


    on(event, callback) {
        this._listeners += 1
        super.on(event, callback)
    }


    /**
     * Use `app.devMode`to do more things when in dev mode.
     */
    get devMode() {
        return !('update_url' in this.browser.runtime.getManifest())
    }


    toString() {
        return `[${this.name}]`
    }
}

module.exports = Skeleton
