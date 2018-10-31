const LE = require('le_js')

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

        this.app.on('ready', () => this.init())

        this.app.on('bg:remote_logger:log', ({level, message, context}) => {
            this.log(level, message, context)
        })
    }

    /**
     * Called when the app state is read (is 'ready').
     */
    init() {
        // TODO test what happens when remoteLogging does not exists,
        // due to the state being of the older version.
        this.settings = this.app.state.settings.telemetry.remoteLogging;
        this.setRemote(this.settings.enabled)

        this.app.on('bg:remote_logger:set_enabled', ({enabled}) => {
            this.setRemote(enabled)
        })
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
     * @param {Boolean} enabled - Enable or disable remote logging.
     */
    setRemote(enabled) {
        if (enabled) {
            if (!this.isRemoteSupported()) {
                console.error('Remote logging enabled, but no API KEY is defined!')
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
        } else {
            if (this.logentries) {
                LE.destroy(LOG_NAME)
                this.logentries = null;
            }
            if (!this.persistentTrace) {
                this.setTrace(null)
            }
        }
    }

    /**
     * Build a message to be sent to the LogEntries.
     * @param {String} message - Message to log.
     * @param {Object} context - Optional extra context information.
     * @returns {Object} - log message object.
     */
    buildMessage(message, context) {
        const release = [
            process.env.VERSION,
            process.env.PUBLISH_CHANNEL,
            process.env.BRAND_TARGET,
            this.app.env.name,
        ].join('-')

        // TODO: extract things from the context which don't change very often?
        //       like app versions, userAgent etc.
        //       actually the only thing that could change is the connection.
        return Object.assign({
            timestamp: new Date().toISOString(),
            trace: this.settings.trace,
            message: message,

            navigator: {
                // User agent string contains platform, browser and version.
                userAgent: navigator.userAgent,
                language: navigator.language,
                deviceMemory: navigator.deviceMemory,
                cookieEnabled: navigator.cookieEnabled,
                doNotTrack: navigator.doNotTrack,

                // TODO doesn't work in BG.
                screen: {
                    width: window.screen.width,
                    height: window.screen.height,
                },

                // Connection info.
                connection: {
                    downlink: navigator.connection.downlink,
                    effectiveType: navigator.connection.effectiveType,
                    rtt: navigator.connection.rtt,
                },
            },

            app: {
                release: release,
                sipjs: SIP.version,
                vuejs: Vue.version,
                // TODO Input/output devices
            },
        }, context)
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

        const msg = this.buildMessage(message, context)
        if (this.logentries) {
            this.logentries[mappedLevel](msg)
        } else {
            // TODO queue message in local log storage.
        }
    }
}


module.exports = RemoteLogger
