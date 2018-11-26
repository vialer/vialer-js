/**
* The Foreground app namespace.
* @namespace AppForeground
*/
const App = require('../lib/app')
const env = require('../lib/env')({section: 'fg'})
const Media = require('../lib/media')
const Sounds = require('../lib/sounds')

/**
* Reactive HTML User Interface that interacts with
* AppBackground to render its state.
* @extends App
*/
class AppForeground extends App {
    /**
    * Set some application events, initialize Vue components and
    * fire up the store.
    * @param {Object} opts - Options to initialize AppForeground with.
    * @param {Object} opts.env - The environment sniffer.
    */
    constructor(opts) {
        super(opts)

        // Allow context debugging during development.
        // Avoid leaking this global in production mode!
        if (!(process.env.NODE_ENV === 'production')) global.fg = this
        // Make state modifications from AppBackground, but only
        // after fg had its initial state received from bg.
        this.on('fg:set_state', (data) => {
            // When sending the whole background state, make sure that
            // the env property of the foreground is never overwritten.
            if (data.state && data.state.env) delete data.state.env
            this.__mergeState(data)
        })

        // Log the context when requested.
        this.on('fg:logger:request_context', () => this.logContext())

        /**
        * @namespace AppForeground.components
        */
        this.components = {
            About: require('../../components/about'),
            AccountPicker: require('../../components/account_picker'),
            Activity: require('../../components/activity'),
            Availability: require('../../components/availability'),
            Call: require('../../components/call'),
            CallKeypad: require('../../components/call_keypad'),
            Calls: require('../../components/calls'),
            CallSwitch: require('../../components/call_switch'),
            Contacts: require('../../components/contacts'),
            DevicePicker: require('../../components/device_picker'),
            Login: require('../../components/login'),
            MainCallBar: require('../../components/main_callbar'),
            MainMenuBar: require('../../components/main_menubar'),
            MainStatusBar: require('../../components/main_statusbar'),
            MicPermission: require('../../components/mic_permission'),
            Notifications: require('../../components/notifications'),
            Settings: require('../../components/settings'),
            Soundmeter: require('../../components/soundmeter'),
            Wizard: require('../../components/wizard'),
        }

        this.__loadPlugins(opts.plugins)

        for (const name of Object.keys(this.components)) {
            Vue.component(name, this.components[name](this))
        }

        require('../../components/field')(this)

        this.__initStore()
    }


    /**
    * Initialize the store by asking AppBackground for the
    * current state.
    */
    __initStore() {
        super.__initStore()
        // Initialize with the initial state from the background.
        this.emit('bg:get_state', {
            callback: async(state) => {
                // Make sure that the webview doesn't use the referenced
                // state object from the background. Extensions also
                // serialize data between scripts, so this is done in
                // webview mode as well for consistency's sake.
                this.state = JSON.parse(state)
                // (!) Don't inherit the env of the background script.
                this.state.env = this.env

                this.__initViewModel({
                    main: require('../../components/main')(this),
                })
                this.media = new Media(this)

                this.sounds = new Sounds(this)
                this.vm.$mount(document.querySelector('#app-placeholder'))
                this.setState({ui: {visible: true}})
                if (this.env.isExtension) {
                    // Keep track of the popup's visibility status by
                    // opening a long-lived connection to the background.
                    chrome.runtime.connect({name: 'vialer-js'})
                    // This check is also required in the foreground, since
                    // the popup opens a popout which is the only way an
                    // extension can be given permission.
                    this.media.poll()
                }

            },
        })
    }


    /**
     * Log a detailed description of the environment we are running in to the
     * remote logger.
     */
    logContext() {
        const release = [
            process.env.VERSION,
            process.env.PUBLISH_CHANNEL,
            process.env.BRAND_TARGET,
            this.env.name,
        ].join('-')

        const context = {
            app: {
                release: release,
                sipjs: SIP.version,
                vuejs: Vue.version,
                env: this.env,
            },

            navigator: {
                // User agent string contains platform, browser and version.
                userAgent: navigator.userAgent,
                language: navigator.language,
                deviceMemory: navigator.deviceMemory,
                cookieEnabled: navigator.cookieEnabled,
                doNotTrack: navigator.doNotTrack,

                screen: {
                    width: window.screen.width,
                    height: window.screen.height,
                },

                connection: {
                    downlink: navigator.connection.downlink,
                    effectiveType: navigator.connection.effectiveType,
                    rtt: navigator.connection.rtt,
                },
            },
        }

        this.logger.info('[context] reporting to remote logger', context)
    }


    /**
    * Generate a representational name for this module. Used for logging.
    * @returns {String} - An identifier for this module.
    */
    toString() {
        return '[fg] '
    }
}

const options = require('./lib/options')
// Used in browser context to allow a context closure without
// having to make an additional JavaScript build target.
if (env.isBrowser) {
    if (env.isExtension) {
        Raven.context(function() {
            this.fg = new AppForeground(options)
        })
    } else {
        global.AppForeground = AppForeground
        global.fgOptions = options
    }
} else {
    // Use with Node.
    module.exports = {AppForeground, options}
}
