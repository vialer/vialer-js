const App = require('../lib/app')
const utils = require('../lib/utils')


let env = JSON.parse(JSON.stringify(require('../lib/env')))
env.role.fg = true


class ForegroundApp extends App {

    constructor(options) {
        options.env = env
        super(options)
        this.env = env

        this.on('fg:notify', (message) => {
            this.vm.$notify(message)
        })

        /**
        * Syncs state from the background to the foreground
        * while keeping Vue's reactivity system happy.
        */
        this.on('fg:set_state', this.__mergeState.bind(this))

        // Component helpers.
        this.helpers = require('../../components/helpers')(this)
        this.utils = require('../lib/utils')

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
        Vue.component('Queues', require('../../components/queues')(this))

        this.initStore()
    }


    initStore() {
        super.initStore()
        // Initialize with the initial state from the background.

        this.emit('bg:get_state', {
            callback: (state) => {
                // Make sure that the webview doesn't use the referenced
                // state object from the background. Extensions also
                // serialize data between scripts, so this is done in
                // webview mode as well for consistency's sake.
                this.state = JSON.parse(JSON.stringify(state))

                // Extension has a popout mode, where the plugin is opened
                // in a tab. Set a flag if this is the case.
                let searchParams = utils.parseSearch(location.search)
                if (searchParams.popout) this.state.env.isPopout = true
                else this.state.env.isPopout = false

                this.initViewModel()
                this.vm.$mount(document.querySelector('#app-placeholder'))
                this.setState({ui: {visible: true}})
                if (this.env.isExtension) {
                    // Kkeep track of the popup's visibility status by
                    // opening a long-lived connection to the background.
                    chrome.runtime.connect({name: 'vialer-js'})
                }
            },
        })
    }
}


function initApp(initParams) {
    initParams.modules = []
    const app = new ForegroundApp(initParams)

    if (app.env.isChrome) $('html').addClass('chrome')
    if (app.env.isEdge) $('html').addClass('edge')
    if (app.env.isFirefox) $('html').addClass('firefox')

    if (app.env.isMacOS) {
        // Forces height recalculation of the popup in Chrome OSX.
        // See: https://bugs.chromium.org/p/chromium/issues/detail?id=307912
        setTimeout(() => {
            const style = document.querySelector('#app').style
            style.display = 'flex'
            setTimeout(() => {
                style.opacity = 1
            });
        }, 200)
    }

    navigator.mediaDevices.getUserMedia({audio: true}).then((stream) => {
        app.localStream = stream
        app.state.settings.webrtc.permission = true
    }).catch((err) => {
        app.state.settings.webrtc.permission = false
    })

    return app
}


// For extensions, this is an executable endpoint.
if (env.isExtension) {
    let searchParams = utils.parseSearch(location.search)
    if (searchParams.popout) {
        env.role.popout = true
    }

    global.app = initApp({name: 'fg'})
}

module.exports = initApp
