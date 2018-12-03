const LE = require('le_js')
const { anonymize } = require('./anonymize')
const LocalLogBuffer = require('./buffer.js')

// Log name in LogEntries.
const LOG_NAME = 'default'

const INITIAL_SETTINGS = {
    enabled: false,
    trace: null,
    apiKey: null,
}

// When flushing the local log buffer to LogEntries we keep a lid on.
// Flush in batches of `FLUSH_SIZE` and then sleep for `FLUSH_DELAY` ms.
// After each send sleep for `FLUSH_THROTTLE` milliseconds.
const FLUSH_SIZE = 100
const FLUSH_DELAY = 2000
const FLUSH_THROTTLE = 25


// TODO move this to a lib/utils.js or something.

/**
 * Sleep for a number of milliseconds. This will not block the thread, but
 * instead it returns a `Promise` which will resolve after `ms`
 * milliseconds.
 *
 * @param {Number} ms - Number of milliseconds to sleep.
 * @returns {Promise} - which resolves after `ms` milliseconds.
 */
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
}


/**
 * Remote Logger will sent log messages to LogEntries, if remote logging is
 * enabled by the user.
 */
class RemoteLogger {

    constructor(app) {
        this.app = app
        this.logentries = null
        this.persistentTrace = true
        this.settings = INITIAL_SETTINGS
        this.contextTimer = null

        this.buffer = new LocalLogBuffer(this)

        this.app.on('ready', () => this.init())

        this.app.on('bg:remote_logger:log', ({level, message, context}) => {
            this.log(level, message, context)
        })
    }

    /**
     * Called when the app is ready.
     */
    init() {
        this.settings = this.app.state.settings.telemetry.remoteLogging
        this.setRemote(this.settings.enabled)

        this.app.on('bg:remote_logger:set_enabled', ({enabled}) => {
            this.setRemote(enabled)
        })

        this.app.logger.info(`${this} initialized`)
    }

    generateTrace() {
        return (Math.random() + Math.PI).toString(36).substring(2, 10)
    }

    isRemoteSupported() {
        return !!this.settings.apiKey
    }

    setTrace(trace) {
        this.settings.trace = trace
        this.app.setState({settings: {telemetry: {remoteLogging: {trace: trace}}}})
    }

    /**
     * Enable or disable remote logging.
     * @param {Boolean} enabled - Enable remote logging or not.
     */
    setRemote(enabled) {
        if (enabled) {
            // Prevent re-enabling, LogEntries API doesn't like that.
            if (!this.logentries) {
                this.enableRemote()
            }
        } else {
            this.disableRemote()
        }
    }

    enableRemote() {
        if (!this.isRemoteSupported()) {
            console.error(`${this} Remote logging enabled, but no API KEY is defined!`)
            return
        }

        if (!this.settings.trace) {
            this.setTrace(this.generateTrace())
        }

        LE.createLogStream({
            name: LOG_NAME,
            token: this.settings.apiKey,
            ssl: true,
            page_info: 'never',
            print: false,
            // Built-in trace is disabled, since we have no way to extract
            // the randomly created code from the library.
            trace: null,
            catchall: false,
        })

        this.logentries = LE.to(LOG_NAME)

        // Request a context to be logged now.
        this.app.emit('bg:context_logger:trigger')

        // Flush the local log buffer to remote.
        this.flush()
    }

    disableRemote() {
        if (this.logentries) {
            LE.destroy(LOG_NAME)
            this.logentries = null
        }
        if (!this.persistentTrace) {
            this.setTrace(null)
        }
    }

    /**
     * Send a log message to the remote logger.
     * The `message` field is anonymized by the `anonymize` function.
     * @param {String} level - Logging level.
     * @param {String} message - Message to log.
     * @param {Object} context - Optional context.
     */
    log(level, message, context) {
        const msg = Object.assign({
            timestamp: new Date().toISOString(),
            trace: this.settings.trace,
            level: level,
            message: anonymize(message),
        }, context)

        if (this.logentries) {
            this._send(msg)
        } else {
            this.buffer.append([msg]).catch(console.error)
        }
    }

    /**
     * Send a log message to LogEntries.
     * @param {Object} msg - Composed message (see `log`).
     */
    _send(msg) {
        this.logentries.log(msg)
    }

    /**
     * Flush the buffer to LogEntries.
     */
    async flush() {
        // Purge first to remove outdated messages.
        await this.buffer.purge()

        let count = await this.buffer.count()
        this.app.logger.info(`${this} flushing ${count} messages to remote`)

        while (count > 0) {
            let batch = await this.buffer.take(FLUSH_SIZE)
            count -= batch.length
            if (batch.length === 0) {
                break
            }

            for (let msg of batch) {
                msg.trace = this.settings.trace
                this._send(msg)
                await sleep(FLUSH_THROTTLE)
            }

            console.log(`${this} flushed ${batch.length} messages, ${count} are left`)

            if (count > 0) {
                await sleep(FLUSH_DELAY)
            }
        }

        this.app.logger.info(`${this} flushed all messages`)

        if (count > 0) {
            this.app.logger.warn(`${this} failed to flush ${count} messages`)
        }
    }

    toString() {
        return '[bg] [RemoteLogger]'
    }
}


module.exports = RemoteLogger
