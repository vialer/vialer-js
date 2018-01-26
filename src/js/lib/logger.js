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


    notification(message, title = 'Vialer', stack = false, type = 'info') {
        // Edge doesn't support webextension Notifications yet.
        if (this.app.env.isEdge) return
        const options = {
            message: message,
            title: title,
            type: 'basic',
        }
        if (type === 'warning') options.iconUrl = 'img/icon-notification-warning.png'
        else options.iconUrl = 'img/icon-notification-info.png'

        if (this.app.env.isExtension) {
            options.iconUrl = browser.runtime.getURL(options.iconUrl)
            if (!stack) browser.notifications.clear('c2d')
            browser.notifications.create('c2d', options)
            return
        }

        options.icon = options.iconUrl
        options.body = message

        if (Notification.permission === 'granted') {
            if (!stack && this._notification) this._notification.close()
            this._notification = new Notification(title, options) // eslint-disable-line no-new
        } else if (Notification.permission !== 'denied') {
            // Create a notification after the user
            // accepted the permission.
            Notification.requestPermission((permission) => {
                if (permission === 'granted') {
                    this._notification = new Notification(title, options) // eslint-disable-line no-new
                }
            })
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
