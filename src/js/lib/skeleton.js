const EventEmitter = require('events').EventEmitter
const I18n = require('./i18n')
const Logger = require('./logger')
const Store = require('./store')


/**
* This is the minimal class that all parts of the click-to-dial
* application inherit from(tab, contentscript, background, popup/out).
* It sets some basic properties that can be reused, like a logger, store,
* an IPC eventemitter and some environmental properties.
*/
class Skeleton extends EventEmitter {

    constructor(options) {
        super()
        this.cache = {}
        this._listeners = 0

        this.utils = require('./utils')
        this.env = this.getEnvironment(options.environment)

        this.modules = {}

        this.name = options.name
        this.store = new Store(this)
        this.i18n = new I18n(this, options.i18n)
        this.logger = new Logger(this)

        this._init()
        // Init these modules.
        for (let module of options.modules) {
            this.modules[module.name] = new module.Module(this)
        }

        // Increases verbosity beyond the logger's debug level.
        this.verbose = false
        // Sets the verbosity of the logger.
        if (process.env.NODE_ENV === 'production') {
            this.logger.setLevel('warn')
        } else {
            this.logger.setLevel('debug')
        }

        if (this.env.extension) {
            // Make the EventEmitter .on method compatible with
            // web extension ipc. An Ipc event is coming in. Map it to
            // the EventEmitter.
            this.browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
                if (request.data) {
                    // Add extra contextual information about sender to payload.
                    request.data.sender = sender
                    // It may have a callback, but functions can't pass through
                    // the request.data, so map sendResponse.
                    request.data.callback = sendResponse
                }
                // The frame option can be used to specifically target a
                // callstatus or observer script. Otherwise the event is
                // ignored, because otherwise all events emitted on the tab will
                // also be processed by the callstatus and observer scripts.
                if (this.env.extension.callstatus || this.env.extension.observer) {
                    if (this.env.extension.callstatus && request.data.frame && request.data.frame === 'callstatus') {
                        this.emit(request.event, request.data, true)
                    } else if (this.env.extension.observer && request.data.frame && request.data.frame === 'observer') {
                        this.emit(request.event, request.data, true)
                    }
                } else {
                    this.emit(request.event, request.data, true)
                }

            })

            // Allows parent scripts to use the same EventEmitter syntax.
            if (this.env.extension.tab) {
                window.addEventListener('message', (event) => {
                    if (this.verbose) this.logger.debug(`${this}emit '${event.data.event}' event from child`)
                    this.emit(event.data.event, event.data.data, true)
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
    * @param {Event} event - Eventname to emit with.
    * @param {Object} data - Payload for the emission.
    * @param {Boolean|String} noIpc - Flag to skip ipc emission or to do `both`.
    * @param {Boolean|String} [tabId=false] - Emit to specific tab over ipc.
    * @param {Boolean|String} [parent=false] - Emit to script's parent over ipc.
    */
    emit(event, data = {}, noIpc = false, tabId = false, parent = false) {
        if (this.env.extension && (!noIpc || noIpc === 'both')) {
            let payloadArgs = []
            let payloadData = {
                data: data,
                event: event,
            }
            payloadArgs.push(payloadData)

            if (tabId) {
                this.logger.debug(`${this}emit ipc event '${event}' to tab ${tabId}`)
                this.browser.tabs.sendMessage(tabId, payloadData)
                return
            } else if (parent) {
                this.logger.debug(`${this}emit ipc event '${event}' to parent`)
                parent.postMessage({
                    data: data,
                    event: event,
                }, '*')
                return
            }

            if (data && data.callback) {
                payloadArgs.push(data.callback)
            }
            this.logger.debug(`${this}emit ipc event '${event}'`)
            this.browser.runtime.sendMessage(...payloadArgs)
        }
        // The web version will always use a local emitter, no matter what
        // the value is of `noIpc`. An extension may do both.
        if (!this.env.extension || noIpc) {
            this.logger.debug(`${this}emit local event '${event}'`)
            super.emit(event, data)
        }
    }


    /**
    * Sets environmental properties, used to distinguish between
    * webextension, regular webapp or Electron app.
    * @param {Object} environment - Environment properties passed
    * to the app's Constructor.
    * @returns {Object} - Environment flags used to make this app universal.
    */
    getEnvironment(environment) {
        // If browser exists, use browser, otherwise take the Chrome API.
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
                this.browser = chrome
            } else {
                environment.extension.isChrome = false
                environment.extension.isFirefox = true
                this.browser = browser
            }
        }


        environment.os = {
            linux: navigator.platform.match(/(Linux)/i) ? true : false,
            osx: navigator.platform.match(/(Mac)/i) ? true : false,
            windows: navigator.platform.match(/(Windows)/i) ? true : false,
        }

        return environment
    }


    on(event, callback) {
        this._listeners += 1
        super.on(event, callback)
    }


    toString() {
        return `[${this.name}] `
    }


    /**
    * This method may be overriden to initialize logic before loading
    * modules, e.g. like initializing a sip stack.
    */
    _init() {}
}

module.exports = Skeleton
