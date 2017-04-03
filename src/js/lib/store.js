'use strict'


/**
 * A meaningful description.
 */
class Store {

    constructor(app) {
        this.app = app
    }

    reset() {
        localStorage.clear()
    }


    get(key) {
        if (this.app.verbose) this.app.logger.debug(`${this}get value for key '${key}'`)
        var value = localStorage.getItem(key)
        if (value) {
            return JSON.parse(value)
        }
        return null
    }


    set(key, value) {
        if (this.app.verbose) this.app.logger.debug(`${this}set ${value} for ${key}`)
        localStorage.setItem(key, JSON.stringify(value))
    }


    remove(key) {
        if (this.get(key)) {
            localStorage.removeItem(key)
        }
    }


    toString() {
        return `${this.app} [Store]              `
    }
}

module.exports = Store
