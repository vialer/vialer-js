const App = require('../lib/app')


let env = JSON.parse(JSON.stringify(require('../lib/env')))
env.role.fg = true


/**
* Main user interface implementation for web.
*/
class AppForeground extends App {

    constructor(options) {
        options.env = env
        super(options)

        // Distinguish between the popout(tab) and popup view.
        let searchParams = this.utils.parseSearch(location.search)

        if (env.isExtension) {
            if (searchParams.popout) {
                $('html').classList.add('popout')
                env.role.popout = true
            } else $('html').classList.add('popup')
        } else if (searchParams.webview) $('html').classList.add('webview')
        else if (env.isElectron) $('html').classList.add('electron')

        this.env = env

        this.on('fg:notify', (message) => this.vm.$notify(message))

        /**
        * Syncs state from the background to the foreground
        * while keeping Vue's reactivity system happy.
        */
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

        this.__initStore()
    }


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

                // Extension has a popout mode, where the plugin is opened
                // in a tab. Set a flag if this is the case.
                let searchParams = this.utils.parseSearch(location.search)
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


function initApp(initParams) {
    initParams.modules = []
    const app = new AppForeground(initParams)

    if (app.env.isChrome) $('html').classList.add('chrome')
    if (app.env.isEdge) $('html').classList.add('edge')
    if (app.env.isFirefox) $('html').classList.add('firefox')
    if (app.env.isExtension) $('html').classList.add('extension')

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

    return app
}


// For extensions, this is an executable endpoint.
if (!global.app) global.app = {}

if (env.isExtension) global.app.fg = initApp({name: 'fg'})
else {
    // Expect background app here.
    global.app.bg.on('ready', () => {
        global.app.fg = initApp({apps: {bg: global.app.bg}, name: 'fg'})

        // Set content height for electron.
        if (global.app.bg.env.isElectron) {
            electron.ipcRenderer.send('resize-window', {
                height: document.body.clientHeight,
                width: document.body.clientWidth,
            })

            resizeSensor(document.body, (e) => {
                electron.ipcRenderer.send('resize-window', {
                    height: document.body.clientHeight,
                    width: document.body.clientWidth,
                })
            })
        }
    })
}


module.exports = initApp
