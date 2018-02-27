/**
 * A thin wrapper around the native console that makes it possible to set
 * loglevels. Use source blacklisting and sourcemaps to get to the
 * original error.
 */
class Logger {

    constructor(app) {
        this.app = app
        this.levels = {
            debug: 4,
            error: 0,
            info: 2,
            verbose: 3,
            warn: 1,
        }

        this.id = 0
        this._notification = null
    }


    debug(...args) {
        if (this.level >= this.levels.debug) {
            args[0] = `%c${args[0]}`
            args.push('color: #999')
            console.log(...args)
        }
    }


    error(...args) {
        console.error(...args)
    }


    info(...args) {
        if (this.level >= this.levels.info) {
            console.info(...args)
        }
    }

    group(name) {
        console.group(name)
    }


    groupEnd() {
        console.groupEnd()
    }


    setLevel(level) {
        this.level = this.levels[level]
    }


    verbose(...args) {
        if (this.level >= this.levels.verbose) {
            console.log(...args)
        }
    }


    warn(...args) {
        if (this.level >= this.levels.warn) {
            console.warn(...args)
        }
    }
}

module.exports = Logger
