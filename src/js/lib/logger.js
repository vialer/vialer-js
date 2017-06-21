'use strict'
/**
 * A thin wrapper around the native console that makes it possible to set
 * loglevels. Use source blacklisting and sourcemaps to get to the
 * original error.
 */
class Logger {

    constructor() {
        this.levels = {error: 0, warn: 1, info: 2, verbose: 3, debug: 4}
        this.setLevel('debug')
    }


    setLevel(level) {
        this.level = this.levels[level]
    }

    error(...args) {
        console.error(...args)
    }

    warn(...args) {
        if (this.level >= this.levels.warn) {
            console.warn(...args)
        }
    }

    info(...args) {
        if (this.level >= this.levels.info) {
            console.info(...args)
        }
    }

    verbose(...args) {
        if (this.level >= this.levels.verbose) {
            console.log(...args)
        }
    }

    debug(...args) {
        if (this.level >= this.levels.debug) {
            args[0] = `%c ${args[0]}`
            args.push('color: #999')
            console.log(...args)
        }
    }
}

module.exports = Logger
