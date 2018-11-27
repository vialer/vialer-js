const LE = require('le_js')

// Log name in LogEntries.
const LOG_NAME = 'default'

const INITIAL_SETTINGS = {
    enabled: false,
    trace: null,
    apiKey: null,
}

const LEVELS_MAP = {
    error: 'error',
    warn: 'warn',
    info: 'info',
    log: 'log',
    debug: 'log',
    verbose: 'log',
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

        this.app.logger.info('[bg] Remote logger initialized')
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
            console.error('Remote logging enabled, but no API KEY is defined!')
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
    }

    disableRemote() {
        if (this.logentries) {
            LE.destroy(LOG_NAME)
            this.logentries = null;
        }
        if (!this.persistentTrace) {
            this.setTrace(null)
        }
    }

    /**
     * Send a log message to the remote logger.
     * @param {String} level - Logging level, must be in `LEVELS_MAP`.
     * @param {String} message - Message to log.
     * @param {Object} context - Optional context.
     */
    log(level, message, context) {
        const mappedLevel = LEVELS_MAP[level]
        if (!mappedLevel) {
            console.warn(`Logging level '${level}' is not supported by RemoteLogger.`)
            return
        }

        const msg = Object.assign({
            timestamp: new Date().toISOString(),
            trace: this.settings.trace,
            message: message,
        }, context)

        if (this.logentries) {
            this.logentries[mappedLevel](msg)
        } else {
            // TODO queue message in local log storage.
        }
    }
}


module.exports = RemoteLogger
