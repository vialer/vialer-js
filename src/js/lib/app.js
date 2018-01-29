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
            },
            dialpad: {
                dialNumber: '',
            },
            notifications: [],
            queues: {
                queues: [],
                selected: {id: null},
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
                ringtones: {
                    options: [
                        {id: 1, name: 'default.ogg'},
                    ],
                    selected: {id: 1, name: 'default.ogg'},
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
                    sinks: {
                        input: {id: '', name: ''},
                        output: {id: '', name: ''},
                    },
                    username: '',
                },
            },
            sip: {
                call: {
                    active: null,
                }, // The active/selected call.
                calls: {}, // Maps to SipJS session ids.
                ua: {
                    state: null,
                },
            },
            ui: {
                layer: 'login',
            },
            user: {
                authenticated: false,
                email: '',
                language: 'nl',
                password: '',
            },
        }

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
        this.state = {
            env: this.env,
            notifications: [],
        }
    }


    initVm() {
        this.initI18n()
        this.vm = new Vue({
            data: {
                store: this.state,
            },
            mounted: () => {
                // Chrome OSX height calculation bug, see:
                // https://bugs.chromium.org/p/chromium/issues/detail?id=428044
                if (this.env.isOsx) {
                    document.body.style.display = 'none'
                    setTimeout(() => {
                        document.body.style.display = 'block'
                    }, 200)
                }
            },
            render: h => h(require('../../components/main')(this)),
        })
    }


    /**
    * Find and return a (sub)object by reference.
    * @param {Object} queryObject - The object to find a (sub)reference for.
    * @param {String} path - The path to the sub-reference.
    * @param {Number} fromEnd - Splits the path into reference and right keys.
    * @returns {Object} - The (sub)reference and the right keys.
    */
    queryReference(queryObject, path, fromEnd = 0) {
        let reference
        const paths = path.split('/')
        const slicePoint = (paths.length) - fromEnd
        let keysLeft = paths.slice(0, slicePoint)
        let keysRight = paths.slice(slicePoint)

        for (const key of keysLeft) {
            if (!reference) reference = queryObject[key]
            else if (reference[key]) reference = reference[key]
        }

        return {keysRight, reference}
    }
}

module.exports = App
