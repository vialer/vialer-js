/**
* A simple localstorage store.
*/
class Store {

    constructor(app) {
        this.app = app
        this.dbSchema = '1.0'
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
        if (this.app.verbose) this.app.logger.debug(`${this}set ${value} for ${key}`)
        localStorage.setItem(key, JSON.stringify(value))
    }


    toString() {
        return `${this.app}[store] `
    }


    validSchema() {
        let schema = this.get('db_schema')
        if (!schema || schema !== this.dbSchema) {
            this.set('db_schema', this.dbSchema)
            this.app.logger.warn(`${this}clear data (schema change)`)
            return false
        }

        return true
    }
}

module.exports = Store
