/**
* The Application background module takes care of all
* generic state concerning the app, notifications and
* vendor-specific handling.
* @module ModuleApp
*/
const Plugin = require('vialer-js/lib/plugin')


/**
* Main entrypoint for App.
* @memberof AppBackground.plugins
* @extends Plugin
*/
class PluginApp extends Plugin {
    /**
    * @param {AppBackground} app - The background application.
    */
    constructor(app) {
        super(app)

        this._notifications = {}

        // Start responding to network changes.
        if (!app.env.isNode) {
            window.addEventListener('offline', (e) => {
                this.app.logger.info(`${this}switched to offline modus`)
                this.app.setState({app: {online: false}})
            })

            window.addEventListener('online', (e) => {
                const pollConnection = async() => {
                    const online = await this._checkConnectivity(1000)
                    if (!online) pollConnection()
                }
                pollConnection()
            })
        }
    }


    /**
    * The `online` event and `navigator.onLine` are not accurate,
    * because it only verifies network connectivity, and not
    * access to the internet. This additional check sees if
    * we can open a websocket to the defined endpoint.
    * Fallback to `navigator.onLine` if there is no endpoint
    * to check.
    * @param {Number} pause - Pauses resolving when polling is necessary.
    * @returns {Promise} - Resolves when the websocket opens or fails.
    */
    _checkConnectivity(pause) {
        return new Promise((resolve) => {
            const endpoint = this.app.state.settings.webrtc.endpoint.uri
            if (endpoint) {
                this.app.logger.info(`${this}verifying online modus`)

                const checkSocket = new WebSocket(`wss://${endpoint}`, 'sip')
                checkSocket.onopen = (event) => {
                    this.app.logger.info(`${this}switched to online modus`)
                    this.app.setState({app: {online: true}})
                    checkSocket.close()
                    if (pause) setTimeout(() => resolve(true), pause)
                    else resolve(true)
                }

                checkSocket.onerror = (error) => {
                    this.app.setState({app: {online: false}})
                    if (pause) setTimeout(() => resolve(false), pause)
                    else resolve(false)
                }
            } else {
                this.app.setState({app: {online: navigator.onLine}})
                resolve(navigator.onLine)
            }
        })
    }


    /**
    * Initializes the module's store.
    * @returns {Object} The module's store properties.
    */
    _initialState() {
        return {
            installed: true,
            name: process.env.APP_NAME,
            notifications: [],
            online: true,
            session: {
                active: null,
                available: [],
            },
            updated: false,
            vault: {
                key: null,
                salt: null,
                store: true,
                unlocked: false,
            },
            vendor: {
                name: process.env.VENDOR_NAME,
                portal: {
                    name: process.env.PORTAL_NAME,
                    url: process.env.PORTAL_URL,
                },
                support: {
                    email: process.env.VENDOR_SUPPORT_EMAIL,
                    phone: process.env.VENDOR_SUPPORT_PHONE,
                    website: process.env.VENDOR_SUPPORT_WEBSITE,
                },
            },
            version: {
                current: process.env.VERSION,
                previous: process.env.VERSION,
            },
        }
    }


    /**
    * Restore stored dumped state from localStorage.
    * @param {Object} moduleStore - Root property for this module.
    */
    _restoreState(moduleStore) {
        moduleStore.notifications = []
        moduleStore.online = true
    }


    _watchers() {
        return {
            /**
            * Schedule removal of a newly add notification if it
            * has a timeout property.
            * @param {Array} notifications - A reference to the current content of notifications.
            */
            'store.app.notifications': (notifications) => {
                for (const notification of notifications) {
                    if (notification.timeout && !this._notifications[notification.id]) {
                        this._notifications[notification.id] = setTimeout(() => {
                            // Use the notification reference from state here,
                            // or this method will not behave consistently.
                            notifications = this.app.state.app.notifications.filter(i => i.id !== notification.id)
                            this.app.setState({app: {notifications}})
                            delete this._notifications[notification.id]
                        }, notification.timeout)
                    }
                }
            },
            'store.app.vault.store': (storeVaultKey) => {
                // Only respond as long the user is logged in.
                if (!this.app.state.user.authenticated) return

                if (storeVaultKey) {
                    this.app.crypto.storeVaultKey()
                } else {
                    this.app.logger.info(`${this}disabling auto session recovery`)
                    this.app.setState({app: {vault: {key: null}}}, {encrypt: false, persist: true})
                }
            },
        }
    }


    /**
    * Generate a representational name for this module. Used for logging.
    * @returns {String} - An identifier for this module.
    */
    toString() {
        return `${this.app}[app] `
    }
}

module.exports = PluginApp
