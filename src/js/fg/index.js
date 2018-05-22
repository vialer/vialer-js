/**
* The Foreground app namespace.
* @namespace AppForeground
*/
const App = require('../lib/app')
const env = require('../lib/env')({role: 'fg'})


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

        // Create a remote notification.
        this.on('fg:notify', (message) => this.vm.$notify(message))
        // Make state modifications from AppBackground, but only
        // after fg had its initial state received from bg.
        this.on('fg:set_state', (data) => {
            // When sending the whole background state, make sure that
            // the env property of the foreground is never overwritten.
            if (data.state && data.state.env) delete data.state.env
            this.__mergeState(data)
        })

        /**
        * @namespace AppForeground.components
        */
        this.components = {
            About: require('../../components/about'),
            Activity: require('../../components/activity'),
            Availability: require('../../components/availability'),
            Call: require('../../components/call'),
            CallKeypad: require('../../components/call_keypad'),
            Calls: require('../../components/calls'),
            CallSwitch: require('../../components/call_switch'),
            Contacts: require('../../components/contacts'),
            Field: require('../../components/field'),
            Login: require('../../components/login'),
            MainCallBar: require('../../components/main_callbar'),
            MainMenuBar: require('../../components/main_menubar'),
            MainStatusBar: require('../../components/main_statusbar'),
            MicPermission: require('../../components/mic_permission'),
            Notifications: require('../../components/notifications'),
            Queues: require('../../components/queues'),
            Settings: require('../../components/settings'),
            Soundmeter: require('../../components/soundmeter'),
            VoipaccountPicker: require('../../components/voipaccount_picker'),
            Wizard: require('../../components/wizard'),
        }

        for (const name of Object.keys(this.components)) {
            Vue.component(name, this.components[name](this))
        }

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

                await this.__initViewModel()
                this.vm.$mount(document.querySelector('#app-placeholder'))
                this.setState({ui: {visible: true}})
                if (this.env.isExtension) {
                    // Keep track of the popup's visibility status by
                    // opening a long-lived connection to the background.
                    chrome.runtime.connect({name: 'vialer-js'})
                }
            },
        })
    }


    /**
    * Generate a representational name for this module. Used for logging.
    * @returns {String} - An identifier for this module.
    */
    toString() {
        return '[fg] '
    }
}

let fgOptions = {env, modules: []}
// Used in browser context to allow a context closure without
// having to make an additional JavaScript build target.
if (env.isBrowser) {
    if (env.isExtension) {
        Raven.context(function() {
            this.fg = new AppForeground(fgOptions)
        })
    } else {
        global.AppForeground = AppForeground
        global.fgOptions = fgOptions
    }
} else {
    // Use with Node.
    module.exports = {AppForeground, fgOptions}
}
