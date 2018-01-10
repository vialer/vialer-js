const Skeleton = require('./skeleton')


/**
* The App class is a less light-weight version of the Skeleton.
* It is extended with UI-specific libraries and should only
* be used for the background and the foreground(popup) script.
*/
class App extends Skeleton {
    constructor(options) {
        super(options)
    }


    _init() {
        this.sounds = require('./sounds')

        let actions = require('../../components/actions')(this)
        Vue.component('Field', require('../../components/field')(this, actions))
        Vue.component('Navigation', require('../../components/navigation')(this, actions))
        Vue.component('Availability', require('../../components/availability')(this, actions))
        Vue.component('Contacts', require('../../components/contacts')(this, actions))
        Vue.component('Login', require('../../components/login')(this, actions))
        Vue.component('Settings', require('../../components/settings')(this, actions))
        Vue.component('Dialpad', require('../../components/dialpad')(this, actions))
        Vue.component('Queues', require('../../components/queues')(this, actions))
        this.initStore()
    }


    /**
    * Provide the initial application state, when there is no state
    * available from localstorage.
    * @returns {Object} - The initial Vue-stash structure.
    */
    getDefaultState() {
        let defaultState = {
            availability: {
                available: 'yes',
                destination: {
                    id: null,
                    name: null,
                },
                destinations: [],
                sud_id: null,
                widget: {
                    active: false,
                    state: '',
                },
            },
            contacts: {
                contacts: [],
                search: {
                    disabled: false,
                    input: '',
                },
                sip: {
                    state: 'disconnected',
                },
                widget: {
                    active: false,
                    state: '',
                },
            },
            dialpad: {
                dialNumber: '',
            },
            queues: {
                queues: [],
                selectedQueue: null,
                widget: {
                    active: false,
                    state: '',
                },
            },
            settings: {
                click2dial: {
                    blacklist: [],
                    enabled: true,
                },
                platform: {
                    enabled: true,
                    url: process.env.PLATFORM_URL,
                },
                sipEndpoint: process.env.SIP_ENDPOINT,
                telemetry: {
                    analyticsId: process.env.ANALYTICS_ID,
                    clientId: null,
                    enabled: false,
                },
                webrtc: {
                    enabled: false,
                    password: '',
                    username: '',
                },
            },
            ui: {
                layer: 'app',
            },
            user: {
                language: 'nl',
            },
        }

        defaultState.user.authenticated = (this.store.get('user') && this.store.get('username') && this.store.get('password'))
        // Deliberately named username and not email, because this can be both
        // an account id (raw softphone) or an email address with platform
        // integration.
        defaultState.user.username = this.store.get('username')
        defaultState.user.password = this.store.get('password')
        return defaultState
    }


    /**
    * Create a I18n stash store and pass it to the I18n plugin.
    */
    initI18n() {
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


    /**
    * Application parts using this class should provide their own
    * initStore implementation. The foreground script for instance
    * gets its state from the background, while the background
    * gets its state from localstorage or from a
    * hardcoded default fallback.
    */
    initStore() {
        this.state = {}
    }


    initVm() {
        this.initI18n()
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
    }
}

module.exports = App
