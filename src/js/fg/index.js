/**
* @namespace AppForeground
*/
const App = require('../lib/app')
const env = require('../lib/env')({role: 'fg'})


/**
* HTML User Interface that interacts with AppBackground to
* render its state.
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

        Vue.component('Availability', require('../../components/availability')(this))
        Vue.component('Call', require('../../components/call')(this))
        Vue.component('CallKeypad', require('../../components/call_keypad')(this))
        Vue.component('Calls', require('../../components/calls')(this))
        Vue.component('CallSwitch', require('../../components/call_switch')(this))
        Vue.component('Contacts', require('../../components/contacts')(this))
        Vue.component('Field', require('../../components/field')(this))
        Vue.component('Login', require('../../components/login')(this))
        Vue.component('MainCallBar', require('../../components/main_callbar')(this))
        Vue.component('MainMenuBar', require('../../components/main_menubar')(this))
        Vue.component('MainStatusBar', require('../../components/main_statusbar')(this))
        Vue.component('Notifications', require('../../components/notifications')(this))
        Vue.component('Settings', require('../../components/settings')(this))
        Vue.component('Telemetry', require('../../components/telemetry')(this))
        Vue.component('Unlock', require('../../components/unlock')(this))
        Vue.component('Queues', require('../../components/queues')(this))
        Vue.component('About', require('../../components/about')(this))

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
                        this.state.settings.webrtc.permission = true
                    }).catch((err) => {
                        this.state.settings.webrtc.permission = false
                    })
                } else {
                    this.state.settings.webrtc.permission = false
                }
            },
        })
    }
}


if (!global.app) global.app = {}
let options = {modules: []}

// Outside WebExtension mode, both scripts are running in the same
// browser context. In that case, the AppBackground instance is
// passed to the AppForeground direcly.
if (!env.isExtension) options.apps = {bg: global.app.bg}
global.app.fg = new AppForeground(options)


module.exports = AppForeground
