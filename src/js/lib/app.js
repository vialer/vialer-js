const Skeleton = require('./skeleton')



/**
* The App class is a less light-weight version of the Skeleton.
* It is extended with UI-specific libraries and should only
* be used for the background and the foreground(popup) script.
*/
class App extends Skeleton {

    constructor(options) {
        super(options)

        this._modules = options.modules
        this.modules = {}
        this.sounds = require('./sounds')

        if (this.env.role.bg) this._emitTarget = 'fg'
        else if (this.env.role.fg) this._emitTarget = 'bg'
    }


    __isObject(item) {
        return (item && typeof item === 'object' && !Array.isArray(item))
    }


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
    * Vue-friendly object operations.
    */
    __mergeState({action, path, persist, state}) {
        if (path) {
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

        } else {
            this.__mergeDeep(this.state, state)
        }
        if (persist) this.store.set('state', this.state)
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
    * Provide the initial application state, when there is no state
    * available from localstorage.
    * @returns {Object} - The initial Vue-stash structure.
    */
    _initialState() {
        let state = {}
        for (let moduleName of Object.keys(this.modules)) {
            if (this.modules[moduleName]._initialState) {
                state[moduleName] = this.modules[moduleName]._initialState()
            }
        }

        Object.assign(state, {
            dialpad: {
                dialNumber: '',
            },
            notifications: [],
            ui: {
                layer: 'login',
                visible: false,
            },
        })

        return state
    }


    /**
    * Set the state to default non-logged in but keep
    * some settings and preferences.
    * @returns {Object} Stripped state.
    */
    _resetState() {
        let _state = this._initialState()
        Object.assign(_state, {
            availability: _state.availability,
            calls: _state.calls,
            contacts: _state.contacts,
            queues: _state.queues,
            settings: {
                webrtc: _state.settings.webrtc,
            },
            ui: {layer: 'login'},
            user: _state.user,
        })

        return _state
    }


    /**
    * Create a I18n stash store and pass it to the I18n plugin.
    */
    initI18n() {
        const i18nStore = new I18nStore(this.store)
        Vue.use(i18n, i18nStore)
        if (global.translations && this.state.user.language in translations) {
            Vue.i18n.add(this.state.user.language, translations.nl)
            Vue.i18n.set(this.state.user.language)
        } else {
            // Warn about a missing language when it's a different one than
            // the default.
            if (this.state.user.language !== 'en') {
                this.logger.warn(`No translations found for ${this.state.user.language}`)
            }
        }
        // Add a simple reference to the translation module.
        this.$t = Vue.i18n.translate
    }


    /**
    * Application parts using this class should provide their own
    * initStore implementation. The foreground script for instance
    * gets its state from the background, while the background
    * gets its state from localstorage or from a
    * hardcoded default fallback.
    */
    initStore() {
        this.state = {
            env: this.env,
        }
    }


    initViewModel() {
        this.initI18n()
        this.vm = new Vue({
            data: {
                store: this.state,
            },
            mounted: () => {
                // Chrome OSX height calculation bug, see:
                // https://bugs.chromium.org/p/chromium/issues/detail?id=428044
                if (this.env.isOsx) {
                    document.body.style.display = 'none'
                    setTimeout(() => {
                        document.body.style.display = 'block'
                    }, 200)
                }
            },
            render: h => h(require('../../components/main')(this)),
        })
    }


    /**
    * Load all modules.
    */
    loadModules() {
        // Init these modules.
        for (let module of this._modules) {
            this.modules[module.name] = new module.Module(this)
        }
    }


    /**
    * Set the background state and propagate it to the other end.
    * @param {Object} state - The state to update.
    * @param {Boolean} options - Whether to persist the changed state to localStorage.
    */
    setState(state, {action, path, persist} = {}) {
        if (!action) action = 'merge'
        this.__mergeState({
            action: action,
            path: path,
            persist: persist,
            state: state,
        })

        this.emit(`${this._emitTarget}:set_state`, {
            action: action,
            path: path,
            persist: persist,
            state: this.env.isExtension ? state : JSON.parse(JSON.stringify(state)),
        })
    }
}

module.exports = App
