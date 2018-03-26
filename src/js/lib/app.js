/**
* @namespace App
*/
const Skeleton = require('./skeleton')
const Utils = require('./utils')


/**
* The App class extends from the `Skeleton` class and adds
* optional modules, viewmodel and state handling and
* translations.
*/
class App extends Skeleton {

    constructor(options) {
        super(options)

        this.env = options.env

        // Component helpers.
        this.helpers = require('./helpers')(this)
        this.utils = new Utils()

        this._modules = options.modules
        this.modules = {}
        /** @memberof App */
        this.sounds = require('./sounds')

        // Use shorthand naming for the event target, because
        // the script context is part of the event name as a
        // convention.
        if (this.constructor.name === 'AppBackground') this._emitTarget = 'fg'
        else if (this.constructor.name === 'AppForeground') this._emitTarget = 'bg'
    }


    /**
    * Application parts using this class should provide their own
    * initStore implementation. The foreground script for instance
    * gets its state from the background, while the background
    * gets its state from localstorage or from a
    * hardcoded default fallback.
    */
    __initStore() {
        this.state = {
            env: this.env,
        }
    }


    /**
    * Check if a variable is an object.
    * @param {Array|null|Number|Object} item - The object to check. Can be of any type.
    * @returns {Boolean} Whether the variable is an object or not.
    */
    __isObject(item) {
        return (item && typeof item === 'object' && !Array.isArray(item))
    }


    /**
    * A recursive method to merges two or more objects together. Existing
    * values from target are overwritten by sources.
    * @param {Object} target - The store or a fragment of it.
    * @param {...*} sources - One or more objects to merge to target.
    * @returns {Function} - The result of this method.
    */
    __mergeDeep(target, ...sources) {
        if (!sources.length) return target
        const source = sources.shift()

        if (this.__isObject(target) && this.__isObject(source)) {
            for (const key in source) {
                if (this.__isObject(source[key])) {
                    if (!target[key]) Object.assign(target, { [key]: {} })
                    this.__mergeDeep(target[key], source[key])
                } else {
                    Object.assign(target, { [key]: source[key] })
                }
            }
        }

        return this.__mergeDeep(target, ...sources)
    }


    /**
    * Vue-friendly object merging. The `path` is used to assist
    * Vue's reactivity system to catch up with the changes.
    */
    async __mergeState({action, encrypt = true, path, persist, state}) {
        if (!path) this.__mergeDeep(this.state, state)
        else {
            path = path.split('/')
            if (action === 'insert') {
                this.__setFromPath(this.state, path, state)
            } else if (action === 'merge') {
                const _ref = path.reduce((o, i)=>o[i], this.state)
                this.__mergeDeep(_ref, state)
            } else if (action === 'delete') {
                const _ref = path.slice(0, path.length - 1).reduce((o, i)=>o[i], this.state)
                Vue.delete(_ref, path[path.length - 1])
            } else if (action === 'replace') {
                const _ref = path.slice(0, path.length - 1).reduce((o, i)=>o[i], this.state)
                Vue.set(_ref, path[path.length - 1], state)
            }
        }

        if (persist && this.constructor.name === 'AppBackground') {
            // Background is leading and is the only one that
            // writes to storage using encryption.
            if (encrypt) {
                const encryptedState = await this.crypto.encrypt(this.crypto.sessionKey, JSON.stringify(this.state))
                this.store.set('state.encrypted', encryptedState)
            } else {
                let stateClone = this.store.get('state.unencrypted')
                if (!stateClone) stateClone = {}
                this.__mergeDeep(stateClone, state)
                this.store.set('state.unencrypted', stateClone)
            }
        }
    }


    __setFromPath(obj, is, value) {
        if (is.length === 1) {
            if (!obj[is[0]]) Vue.set(obj, is[0], value)
            return obj[is[0]]
        } else if (is.length === 0) {
            return obj
        } else {
            return this.__setFromPath(obj[is[0]], is.slice(1), value)
        }
    }


    /**
    * Provide the initial application state when no state is
    * available in localstorage.
    * @returns {Object} - The initial Vue-stash structure.
    */
    _initialState() {
        let state = {}
        for (let moduleName of Object.keys(this.modules)) {
            if (this.modules[moduleName]._initialState) {
                state[moduleName] = this.modules[moduleName]._initialState()
            }
        }

        return state
    }


    /**
    * Create a I18n stash store and pass it to the I18n plugin.
    */
    initI18n() {
        const i18nStore = new I18nStore(this.store)
        Vue.use(i18n, i18nStore)
        let selectedLanguage = this.state.settings.language.selected.id
        for (const translation of Object.keys(translations)) {
            Vue.i18n.add(selectedLanguage, translations[translation])
        }
        Vue.i18n.set(selectedLanguage)
        // Add a simple reference to the translation module.
        this.$t = Vue.i18n.translate
    }


    initViewModel(watchers) {
        this.initI18n()
        this.vm = new Vue({
            data: {
                store: this.state,
            },
            mounted: () => {
                // Chrome OSX height calculation bug, see:
                // https://bugs.chromium.org/p/chromium/issues/detail?id=428044
                if (this.env.isMacOS) {
                    document.body.style.display = 'none'
                    setTimeout(() => {
                        document.body.style.display = 'block'
                    }, 200)
                }
            },
            render: h => h(require('../../components/main')(this)),
            watch: watchers,
        })
    }


    /**
    * Set the background state and propagate it to the other end.
    * @param {Object} state - The state to update.
    * @param {Boolean} options - Whether to persist the changed state to localStorage.
    */
    setState(state, {action, encrypt, path, persist} = {}) {
        if (!action) action = 'merge'
        // Merge state in the context of the exeucting script.
        this.__mergeState({action, encrypt, path, persist, state})
        // Sync the state to the other script context(bg/fg).
        // Make sure that we don't pass a state reference over the
        // EventEmitter in case of a webview; this would create
        // unpredicatable side-effects.
        let stateClone = state
        if (!this.env.isExtension) stateClone = JSON.parse(JSON.stringify(state))
        this.emit(`${this._emitTarget}:set_state`, {action, encrypt, path, persist, state: stateClone})
    }
}

module.exports = App
