/**
 * A thin wrapper around the native console that makes it possible to set
 * loglevels.
 * @memberof lib
 */
class Logger {

    constructor(app) {
        this.app = app

        this.LEVELS = {
            error: 0,
            warn: 1,
            info: 2,
            verbose: 3,
            debug: 4,
        }

        this.setLevel('info')
    }


    setLevel(level) {
        if (!this.LEVELS.hasOwnProperty(level)) {
            console.warn(`Logging level '${level}' is not defined.`)
            return
        }

        this.level = this.LEVELS[level]
    }


    log(level, message, context) {
        if (!this.LEVELS.hasOwnProperty(level)) {
            console.warn(`Logging level '${level}' is not defined.`)
            return
        }

        if (this.level >= this.LEVELS[level]) {
            let args = [message]
            if (level === 'debug') {
                args[0] = `%c${args[0]}`
                args.push('color: #999')
            }

            let fn = console[level]
            if (level in ['verbose', 'debug']) fn = console.log
            fn(...args)
        }

        // Emit message to the RemoteLogger.
        this.app.emit('bg:remote_logger:log', {level, message, context})
    }


    // Convenience methods
    error(message, context) {
        this.log('error', message, context)
    }

    warn(message, context) {
        this.log('warn', message, context)
    }

    info(message, context) {
        this.log('info', message, context)
    }

    debug(message, context) {
        this.log('debug', message, context)
    }

    verbose(message, context) {
        this.log('verbose', message, context)
    }
}

module.exports = Logger
