const Skeleton = require('./skeleton')


/**
* The App class extends from the `Skeleton` class and adds
* optional modules, viewmodel and state handling and
* translations.
* @extends Skeleton
*/
class App extends Skeleton {

    constructor(options) {
        super(options)
        /**
        * Environment sniffer.
        */
        this.env = options.env
        this.helpers = require('./helpers')(this)
        /**
        * Contains all registered App modules.
        */
        this.modules = {}
        this._modules = options.modules
        /**
        * Sounds that are used in the application. They can both
        * be triggered from `AppForeground` and `AppBackground`.
        */
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
        /**
        * The state is a reactive store that is used to respond
        * to changes in data. The UI totally depends on the store
        * to render the appropriate views, but also data responds
        * to changes with the use of watchers.
        * @memberof App
        */
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
    * A recursive method that merges two or more objects with
    * nested objects together. Existing values from target are
    * overwritten by sources.
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
    * Vue's reactivity system to catch up with changes.
    * @param {Object} options - Options to pass.
    * @param {String} [options.action] - The merge action: insert|merge|delete|replace.
    * @param {Boolean} [options.encrypt=true] - Whether to persist to the encrypted part of the store.
    * @param {String} options.path - Path to the store parts to merge into.
    * @param {String} [options.persist=false] - Whether to persist this state change.
    * @param {Object} state - An object to merge into the store.
    */
    __mergeState({action = null, encrypt = true, path = null, persist = false, state}) {
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
    }


    /**
    * Set a nested property's value from a string pointing
    * to the reference. To set the value of `foo` in `path.to.foo`,
    * set the path to `/path/to/foo`, give the reference object and
    * its value.
    * @param {Object} obj - Reference object to modify.
    * @param {String} path - URL notation to a nested property.
    * @param {*} value - The value to assign to the nested property.
    * @returns {Function|Object} - Recursive until the property is set. Then returns the reference object.
    */
    __setFromPath(obj, path, value) {
        if (path.length === 1) {
            if (!obj[path[0]]) Vue.set(obj, path[0], value)
            return obj[path[0]]
        } else if (path.length === 0) {
            return obj
        } else {
            return this.__setFromPath(obj[path[0]], path.slice(1), value)
        }
    }


    /**
    * Initializes each module's store and combines the result
    * in a global state object, which is converted to
    * reactive getters/setters by Vue-stash.
    * @returns {Object} The module's store properties.
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
    * Initialize multi-language support. An I18nStore is mounted
    * to the store. Translations can be dynamically added.
    */
    initI18n() {
        const i18nStore = new I18nStore(this.state)
        Vue.use(i18n, i18nStore)
        let selectedLanguage = this.state.settings.language.selected.id
        for (const translation of Object.keys(translations)) {
            Vue.i18n.add(selectedLanguage, translations[translation])
        }
        Vue.i18n.set(selectedLanguage)
        // Add a simple reference to the translation module.
        this.$t = Vue.i18n.translate
    }


    /**
    * Initialize Vue with the Vue-stash store, the
    * root rendering component and gathered watchers
    * from modules.
    * @param {Object} watchers - Store properties to watch for changes.
    */
    initViewModel(watchers) {
        this.initI18n()
        this.vm = new Vue({
            data: {
                store: this.state,
            },
            render: h => h(require('../../components/main')(this)),
            watch: watchers,
        })
    }


    /**
    * Set the state within the own running script context
    * and then propagate the state to the other logical
    * endpoint for syncing.
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
