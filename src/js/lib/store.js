/**
* A simple localstorage store.
*/
class Store {

    constructor(app) {
        this.app = app
        this.schema = 5
    }


    /**
    * Remove all keys from localStorage, except the schema field.
    */
    clear() {
        for (const key in localStorage) {
            if (localStorage.hasOwnProperty(key) && key !== 'schema') this.remove(key)
        }
    }


    get(key) {
        if (this.app.verbose) this.app.logger.debug(`${this}get value for key '${key}'`)
        var value = localStorage.getItem(key)
        if (value) {
            return JSON.parse(value)
        }
        return null
    }


    remove(key) {
        if (this.get(key)) {
            localStorage.removeItem(key)
        }
    }


    reset() {
        localStorage.clear()
    }


    set(key, value) {
        localStorage.setItem(key, JSON.stringify(value))
    }


    toString() {
        return `${this.app}[store] `
    }


    validSchema() {
        let schema = this.get('schema')
        if (schema === null || schema !== this.schema) {
            this.set('schema', this.schema)
            this.app.logger.warn(`${this}store schema changed! db: ${schema} state: ${this.schema}`)
            return false
        }

        return true
    }
}

module.exports = Store
