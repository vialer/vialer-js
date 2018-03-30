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

        // Create a remote notification.
        this.on('fg:notify', (message) => this.vm.$notify(message))
        // Make state modifications from AppBackground.
        this.on('fg:set_state', this.__mergeState.bind(this))

        /**
        * @namespace AppForeground.components
        */
        this.components = {
            About: require('../../components/about'),
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
            Notifications: require('../../components/notifications'),
            Queues: require('../../components/queues'),
            Settings: require('../../components/settings'),
            Telemetry: require('../../components/telemetry'),
            Unlock: require('../../components/unlock'),
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
            callback: (state) => {
                // Make sure that the webview doesn't use the referenced
                // state object from the background. Extensions also
                // serialize data between scripts, so this is done in
                // webview mode as well for consistency's sake.
                this.state = JSON.parse(state)
                // (!) Don't inherit the env of the background script.
                this.state.env = this.env

                this.initViewModel()
                this.vm.$mount(document.querySelector('#app-placeholder'))
                this.setState({ui: {visible: true}})
                if (this.env.isExtension) {
                    // Keep track of the popup's visibility status by
                    // opening a long-lived connection to the background.
                    chrome.runtime.connect({name: 'vialer-js'})
                }

                if (!this.env.isFirefox) {
                    navigator.mediaDevices.getUserMedia({audio: true}).then((stream) => {
                        this.localStream = stream
                        this.state.settings.webrtc.media.permission = true
                    }).catch((err) => {
                        this.state.settings.webrtc.media.permission = false
                    })
                } else {
                    this.state.settings.webrtc.media.permission = false
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


let options = {env, modules: []}

// Outside WebExtension mode, both scripts are running in the same
// browser context. In that case, the AppBackground instance is
// passed to the AppForeground direcly.
if (!env.isExtension) options.apps = {bg: global.bg}
global.fg = new AppForeground(options)


module.exports = AppForeground
