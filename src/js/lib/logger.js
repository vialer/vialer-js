/**
 * A thin wrapper around the native console that makes it possible to set
 * loglevels. Use source blacklisting and sourcemaps to get to the
 * original error.
 */
class Logger {

    constructor(app) {
        this.app = app
        this.levels = {error: 0, warn: 1, info: 2, verbose: 3, debug: 4}
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


    notification(message, title = 'Click-to-dial') {
        const options = {
            type: 'basic',
            title: title,
            message: message,
        }
        if (this.app.env.extension) {
            options.iconUrl = this.app.browser.runtime.getURL('img/clicktodial-big.png')
            this.app.browser.notifications.create(message, options)
        } else {
            options.iconUrl = 'img/clicktodial.png'
            if (Notification.permission === 'granted') {
                new Notification(message, options)
            } else if (Notification.permission !== 'denied') {
                // Create a notification after the user accepted the permission.
                Notification.requestPermission(function(permission) {
                    if (permission === 'granted') {
                        new Notification(message, options)
                    }
                })
            }
        }
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
