const CONTEXT_INTERVAL = 60 * 60 * 1000 // 1 hour in ms


/**
 * Context Logger will log a detailed description of the environment
 * (we call it context here) to the logger.
 *
 * It will also monitor the network connection state and log a message
 * when it changes.
 */
class ContextLogger {

    constructor(app) {
        this.app = app
        app.on('ready', () => this.init())
    }

    init() {
        this.startTimer()
        this.app.on('bg:context_logger:trigger', () => {
            this.performNow()
        })

        if (navigator && navigator.connection) {
            navigator.connection.onchange = (e) => this.connectionChanged(e)
        }
    }

    performNow() {
        this.stopTimer()
        this.timerElapsed()
        this.startTimer()
    }

    startTimer() {
        this.timer = setInterval(() => this.timerElapsed(), CONTEXT_INTERVAL)
    }

    stopTimer() {
        clearInterval(this.timer)
        this.timer = null
    }

    timerElapsed() {
        const release = [
            process.env.VERSION,
            process.env.PUBLISH_CHANNEL,
            process.env.BRAND_TARGET,
            this.app.env.name,
        ].join('-')

        let context = {
            app: {
                release: release,
                sipjs: SIP.version,
                vuejs: Vue.version,
                env: this.app.env,
            },
        }

        if (navigator) {
            context.navigator = {
                userAgent: navigator.userAgent,
                language: navigator.language,
                deviceMemory: navigator.deviceMemory,
                cookieEnabled: navigator.cookieEnabled,
                doNotTrack: navigator.doNotTrack,

                connection: {
                    downlink: navigator.connection.downlink,
                    effectiveType: navigator.connection.effectiveType,
                    rtt: navigator.connection.rtt,
                },
            }

            if (window && window.screen) {
                context.navigator.screen = {
                    width: window.screen.width,
                    height: window.screen.height,
                }
            }
        }

        this.app.logger.info('[bg] [context] reporting', context)
    }

    connectionChanged(e) {
        const net = e.target

        this.app.logger.info(`[bg] [network] connection changed to ${net.effectiveType} (${net.downlink}/${net.rtt})`, {
            effectiveType: net.effectiveType,
            downlink: net.downlink,
            rtt: net.rtt,
        })
    }
}


module.exports = ContextLogger
