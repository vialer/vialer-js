const App = require('../lib/app')
let env = require('../lib/env')
const utils = require('../lib/utils')


class VialerFg extends App {

    constructor(options) {
        super(options)

        this.on('fg:notify', (message) => {
            this.vm.$notify(message)
        })

        // Another script wants to sync this script's state.
        this.on('fg:set_state', ({mount, state}) => {
            if (mount) {
                const paths = mount.path.split('.')
                let target
                for (const path of paths) {
                    if (!target) target = this.state[path]
                    else target = target[path]
                }

                if (mount.type === 'array') {
                    for (const item of target) {
                        if (item.id === mount.id) {
                            this.mergeDeep(item, state)
                        }
                    }
                }
                return
            }
            this.mergeDeep(this.state, state)
        })
    }


    _init() {
        super._init()
        this.utils = require('../../components/utils')(this)

        Vue.component('Availability', require('../../components/availability')(this))
        Vue.component('Callbar', require('../../components/callbar')(this))
        Vue.component('CallDialog', require('../../components/calldialog')(this))
        Vue.component('Contacts', require('../../components/contacts')(this))
        Vue.component('Field', require('../../components/field')(this))
        Vue.component('Keypad', require('../../components/keypad')(this))
        Vue.component('Login', require('../../components/login')(this))
        Vue.component('Notifications', require('../../components/notifications')(this))
        Vue.component('Settings', require('../../components/settings')(this))
        Vue.component('Sidebar', require('../../components/sidebar')(this))
        Vue.component('Statusbar', require('../../components/statusbar')(this))
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
                if (this.env.isExtension) this.state = state
                else {
                    this.state = JSON.parse(JSON.stringify(state))
                }

                // Extension has a popout mode, where the plugin is opened
                // in a tab. Set a flag if this is the case.
                let searchParams = utils.parseSearch(location.search)
                if (searchParams.popout) this.state.env.isPopout = true
                else this.state.env.isPopout = false

                this.initVm()
                this.vm.$mount(document.querySelector('#app-placeholder'))
            },
        })
    }


    /**
    * Set the background state and propagate it to the foreground.
    * @param {Object} state - The state to update.
    * @param {Boolean} persist - Whether to persist the changed state to localStorage.
    */
    setState(state, persist = false) {
        this.mergeDeep(this.state, state)
        // Update the foreground's state with it.
        this.emit('bg:set_state', {
            persist: persist,
            state: state,
        })
    }
}


function initApp(initParams) {
    initParams.modules = []
    const app = new VialerFg(initParams)

    if (app.env.isChrome) $('html').addClass('chrome')
    if (app.env.isEdge) $('html').addClass('edge')
    if (app.env.isFirefox) $('html').addClass('firefox')

    if (app.env.isOsx) {
        setTimeout(() => {
            const style = document.querySelector('#app').style
            style.display = 'flex'
            setTimeout(() => {
                style.opacity = 1
            });
        }, 200)
    }

    navigator.mediaDevices.getUserMedia({audio: true}).then((stream) => {
        this.stream = stream
    }).catch((err) => {
        console.warn(err)
        app.vm.$notify({icon: 'warning', message: `Media access failed: ${err.name}`, type: 'danger'})
    })

    return app
}


// For extensions, this is an executable endpoint.
if (env.isExtension) {
    env.role.popup = true
    let searchParams = utils.parseSearch(location.search)
    if (searchParams.popout) {
        env.role.popout = true
    }

    global.app = initApp({
        environment: env,
        name: 'fg',
    })
}

module.exports = initApp
