/**
* An in-memory store that can implements (part of) the
* localStorage interface.
*/
class MemoryStore {
    constructor() {
        this.data = {}
    }

    getItem(key) {
        return this.data[key]
    }

    removeItem(key) {
        delete this.data[key]
    }

    setItem(key, value) {
        this.data[key] = value
    }
}


/**
* A simple localstorage store.
* AppBackground
*/
class Store {

    constructor(app) {
        this.app = app
        this.schema = 13

        if (this.app.env.isNode) this.store = new MemoryStore()
        else this.store = localStorage
    }


    /**
    * Remove all keys from localStorage, except the schema field.
    */
    clear() {
        let keys
        if (this.app.env.isNode) keys = Object.keys(this.store.data)
        else keys = this.store
        for (const key in keys) {
            if (this.store.getItem(key) && key !== 'schema') this.remove(key)
        }
    }


    /**
    * Multiple users can login the plugin. To prevent state
    * collisioning, each user has its own state namespace, e.g.
    * `myuser@domain/state`. This method returns all available
    * sessions and a preferred one.
    * @returns {Object} - The store sessions.
    */
    findSessions() {
        let active = null
        let available = []
        for (const key of Object.keys(this.store)) {
            if (key.endsWith('state')) {
                const sessionName = key.replace('/state', '')
                available.push(sessionName)
                let state = JSON.parse(this.store.getItem(key))
                // An active session has a stored key.
                if (state.app.vault.salt && state.app.vault.key) {
                    active = sessionName
                }
            }
        }


        return {active, available}
    }


    get(key) {
        if (this.app.verbose) this.app.logger.debug(`${this}get value for key '${key}'`)
        var value = this.store.getItem(key)
        if (value) {
            return JSON.parse(value)
        }
        return null
    }


    remove(key) {
        if (this.get(key)) {
            this.store.removeItem(key)
        }
    }


    reset() {
        this.store.clear()
    }


    set(key, value) {
        this.store.setItem(key, JSON.stringify(value))
    }


    /**
    * Generate a representational name for this module. Used for logging.
    * @returns {String} - An identifier for this module.
    */
    toString() {
        return `${this.app}[store] `
    }


    validSchema() {
        let schema = this.get('schema')
        if (schema === null || schema !== this.schema) {
            this.set('schema', this.schema)
            this.app.logger.warn(`${this}store schema changed! db: ${schema} state: ${this.schema}`)
            if (schema === null) return null
            else return false
        }

        return true
    }
}

module.exports = Store
