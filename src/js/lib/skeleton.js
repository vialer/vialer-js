const EventEmitter = require('eventemitter3')
const Logger = require('./logger')
const Store = require('./store')


/**
* This is the minimal class that all runnable parts of the Vialer-js
* application inherit from(tab, contentscript, background, popup/out).
* It sets some basic properties that can be reused, like a logger, store,
* an IPC eventemitter and some environmental properties.
*/
class Skeleton extends EventEmitter {

    constructor(options) {
        super()

        this.env = options.environment
        // Make Chrome plugin API compatible with the standards
        // WebExtension API as (partly) supported by Firefox and Edge.
        if (this.env.isChrome) window.browser = require('webextension-polyfill')

        // A webview build passes the separate apps, so they can be reached
        // by the EventEmitter.
        if (options.apps) this.apps = options.apps

        this._listeners = 0

        this.utils = require('./utils')
        this.modules = {}

        this.name = options.name
        this.logger = new Logger(this)
        this.store = new Store(this)

        this._init()

        // A state object that can be mutated across instances
        // using {app_name}:set_state and {app_name}:get_state emitters.
        this.on(`${options.name}:get_state`, (data) => {
            // Send this script's state back to the requesting script.
            data.callback(this.state)
        })

        // Another script wants to sync this script's state.
        this.on(`${options.name}:set_state`, (state) => {
            this.mergeDeep(this.state, state)
            this.logger.debug(`${this}updating state`)
            // The background state is the source of truth for persistant
            // state storage. Don't use the fg state for this.
            if (this.name === 'bg') this.store.set('state', this.state)
        })

        this.initStore()

        if (this.env.isExtension) {
            this.ipcListener()
            // Allows parent scripts to use the same EventEmitter syntax.
            if (this.env.role.tab) {
                window.addEventListener('message', (event) => {
                    if (this.verbose) this.logger.debug(`${this}emit '${event.data.event}' event from child`)
                    this.emit(event.data.event, event.data.data, true)
                })
            }
        }


        // Init these modules.
        for (let module of options.modules) {
            this.modules[module.name] = new module.Module(this)
        }

        // Sets the verbosity of the logger.
        if (process.env.NODE_ENV === 'production') {
            this.logger.setLevel('error')
        } else {
            this.logger.info(`${this}loglevel set to debug`)
            this.logger.setLevel('debug')
        }

        // Increases verbosity beyond the logger's debug level. Not
        // always useful during development, so it can be switched
        // of manually.
        if (process.env.VERBOSE === true) this.verbose = true
        else this.verbose = false
        this.logger.info(`${this}verbose mode: ${this.verbose}`)
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
        if (this.env.isExtension && (!noIpc || noIpc === 'both')) {
            let payloadData = {
                data: data,
                event: event,
            }

            if (tabId) {
                if (this.verbose) this.logger.debug(`${this}emit ipc event '${event}' to tab ${tabId}`)
                browser.tabs.sendMessage(tabId, payloadData).catch((err) => {
                    if (this.verbose) this.logger.debug(`${this}${err.message}`)
                })
                return
            } else if (parent) {
                if (this.verbose) this.logger.debug(`${this}emit ipc event '${event}' to parent`)
                parent.postMessage({data: data, event: event}, '*')
                return
            }

            if (data && data.callback) {
                if (this.verbose) this.logger.debug(`${this}emit ipc event with callback '${event}'`)
                const callback = data.callback
                // Make sure that functions are not part of the payload data.
                delete data.callback
                browser.runtime.sendMessage(payloadData).then(function handleResponse(message) {
                    callback(message)
                }).catch((err) => {
                    if (this.verbose) this.logger.debug(`${this}${err.message}`)
                })
            } else {
                if (this.verbose) this.logger.debug(`${this}emit ipc event '${event}'`)
                let _promise = browser.runtime.sendMessage(payloadData)
                if (_promise) {
                    _promise.catch((err) => {
                        if (this.verbose) this.logger.debug(`${this}${err.message}`)
                    })
                }
            }
        }
        // The web version will always use a local emitter, no matter what
        // the value is of `noIpc`. An extension may do both.
        if (!this.env.isExtension || noIpc) {
            if (this.verbose) this.logger.debug(`${this}emit local event '${event}'`)
            if (this.apps) {
                for (const appName of Object.keys(this.apps)) {
                    this.apps[appName].emit(event, data)
                }
            }
            super.emit(event, data)
        }
    }


    getDefaultState() {
        return {
            availability: {
                available: 'yes',
                destinations: {
                    options: [],
                    selected: null,
                },
                widget: {
                    active: false,
                    state: '',
                },
            },
            contacts: {
                contacts: [],
                search: {
                    disabled: false,
                    input: '',
                },
                sip: {
                    state: 'disconnected',
                },
                widget: {
                    active: false,
                    state: '',
                },
            },
            queues: {
                queues: [],
                selectedQueue: null,
                widget: {
                    active: false,
                    state: '',
                },
            },
            user: {
                authenticated: (this.store.get('user') && this.store.get('username') && this.store.get('password')),
                language: 'nl',
                userdestination: {
                    selecteduserdestination: {
                        fixeddestination: {},
                        phoneaccount: {},
                    },
                },
            },
        }
    }


    initStore() {
        this.state = {}
    }


    /**
    * Make the EventEmitter `.on` method compatible with web extension IPC,
    * by mapping an IPC event to the EventEmitter.
    */
    ipcListener() {
        browser.runtime.onMessage.addListener((message, sender) => {
            return new Promise((resolve, reject) => {
                if (message.data) {
                    // Add extra contextual information about sender to payload.
                    message.data.sender = sender
                    // It may have a callback, but functions can't pass through
                    // the request.data, so map sendResponse.
                    message.data.callback = resolve
                }
                // The frame option can be used to specifically target a
                // callstatus or observer script. Otherwise the event is
                // ignored, because otherwise all events emitted on the tab will
                // also be processed by the callstatus and observer scripts.
                if (this.env.role.callstatus || this.env.role.observer) {
                    if (this.env.role.callstatus && message.data.frame && message.data.frame === 'callstatus') {
                        this.emit(message.event, message.data, true)
                    } else if (this.env.role.observer && message.data.frame && message.data.frame === 'observer') {
                        this.emit(message.event, message.data, true)
                    }
                } else {
                    this.emit(message.event, message.data, true)
                }
            })
        })
    }


    isObject(item) {
        return (item && typeof item === 'object' && !Array.isArray(item))
    }



    mergeDeep(target, ...sources) {
        if (!sources.length) return target
        const source = sources.shift()

        if (this.isObject(target) && this.isObject(source)) {
            for (const key in source) {
                if (this.isObject(source[key])) {
                    if (!target[key]) Object.assign(target, { [key]: {} })
                    this.mergeDeep(target[key], source[key])
                } else {
                    Object.assign(target, { [key]: source[key] })
                }
            }
        }

        return this.mergeDeep(target, ...sources);
    }


    /**
    * Override the default EventEmitter's `on` method, in
    * order to keep track of listeners.
    * @param {String} event - Event name to cache.
    * @param {Function} callback - The function to call on this event.
    */
    on(event, callback) {
        this._listeners += 1
        if (this.apps) {
            for (const appName of Object.keys(this.apps)) {
                this.apps[appName].on(event, callback)
            }
        }
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
