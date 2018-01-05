let env = require('../lib/env')
const utils = require('../lib/utils')
const Skeleton = require('../lib/skeleton')


const _modules = [
    {Module: require('./availability'), name: 'availability'},
    {Module: require('./contacts'), name: 'contacts'},
    {Module: require('./user'), name: 'user'},
    {Module: require('./queues'), name: 'queues'},
]


class PopupApp extends Skeleton {

    constructor(options) {
        super(options)
    }

    _init() {
        this.sounds = require('./sounds')
        let actions = require('./components/actions')(this)
        Vue.component('Navigation', require('./components/navigation')(this, actions))
        Vue.component('Availability', require('./components/availability')(this, actions))
        Vue.component('Contacts', require('./components/contacts')(this, actions))
        Vue.component('Login', require('./components/login')(this, actions))
        Vue.component('Settings', require('./components/settings')(this, actions))
        Vue.component('Dialpad', require('./components/dialpad')(this, actions))
        Vue.component('Queues', require('./components/queues')(this, actions))
    }


    _initI18n() {
        // Create a I18n stash store and pass it to the I18n plugin.
        const i18nStore = new I18nStore(this.store)
        Vue.use(i18n, i18nStore)
        if (global.translations && this.state.user.language in translations) {
            Vue.i18n.add(this.state.user.language, translations.nl)
            Vue.i18n.set(this.state.user.language)
        } else {
            // Warn about a missing language when it's a different one than
            // the default.
            if (this.state.user.language !== 'en') {
                this.logger.warn(`No translations found for ${this.state.user.language}`)
            }
        }
        // Add a simple reference to the translation module.
        this.$t = Vue.i18n.translate
    }


    initStore() {
        // Initialize with the initial state from the background.
        this.emit('bg:get_state', {
            callback: (state) => {
                this.state = state
                this._initI18n()
                this.vm = new Vue({
                    data: {
                        store: this.state,
                    },
                    render: h => h({
                        render: templates.main.r,
                        staticRenderFns: templates.main.s,
                        store: this.state,
                    }),
                })
                this.vm.$mount(document.querySelector('#app-placeholder'))
            },
        })
    }
}


function initApp(initParams) {
    initParams.modules = _modules
    const app = new PopupApp(initParams)

    if (app.env.isChrome) $('html').addClass('chrome')
    if (app.env.isEdge) $('html').addClass('edge')
    if (app.env.isFirefox) $('html').addClass('firefox')
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


    navigator.mediaDevices.getUserMedia({audio: true}).then((stream) => {
        this.stream = stream
    }).catch((err) => {
        app.logger.warn(`${this}${err}`)
    })
}
module.exports = initApp
