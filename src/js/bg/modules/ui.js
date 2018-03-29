/**
* This module is responsible for handling all UI-related state and
* respond with UI-specific calls to watchers. UI changes may
* be related to WebExtension-, Electron- or WebView-specific actions
* @module ModuleUI
*/
const Module = require('../lib/module')


/**
* Main entrypoint for UI.
* @memberof AppBackground.modules
*/
class ModuleUI extends Module {
    /**
    * Setup some menubar and click-to-dial icon related properties.
    * @param {AppBackground} app - The background application.
    */
    constructor(app) {
        super(app)
        this.animationStep = 0
        this.animations = {
            ringing: {
                direction: 1,
                frame: 0,
                frames: 5,
                intervalId: null,
            },
        }
        // Used to restore the Click-to-dial icon label message when
        // a tab refreshes and a call is still ongoing.
        this.lastLabelMessage = null
    }


    /**
    * Add an animating dot to the menubar by using the setIcon
    * method for the menubar as a way to set animation frames.
    * @param {String} name - One of the animation presets defined in `this.animations`.
    */
    __menubarAnimation(name) {
        // Clear all previously set animations.
        if (!name) {
            for (let _name of Object.keys(this.animations)) {
                if (this.animations[_name].intervalId) {
                    clearInterval(this.animations[_name].intervalId)
                }
            }
            return
        }
        let animation = this.animations[name]
        animation.intervalId = window.setInterval(() => {
            browser.browserAction.setIcon({path: `img/menubar-ringing-${this.animations[name].frame}.png`})
            if (animation.direction === 1) {
                animation.frame += 1
                // Reverse the direction on the last frame.
                if (animation.frame === (animation.frames - 1)) animation.direction = -animation.direction
            } else {
                animation.frame -= 1
                // Reverse the direction on the first frame.
                if (animation.frame === 0) animation.direction = -animation.direction
            }
        }, 100)
    }


    /**
    * Initializes the module's store.
    * @returns {Object} The module's store properties.
    */
    _initialState() {
        return {
            layer: 'login',
            menubar: {
                default: 'inactive',
                event: null,
            },
            overlay: null,
            tabs: {
                settings: {
                    active: 'phone',
                },
            },
            visible: false,
        }
    }


    /**
    * Restore stored dumped state from localStorage.
    * The menubar should be inactive without any overriding events.
    * @param {Object} moduleStore - Root property for this module.
    */
    _restoreState(moduleStore) {
        moduleStore.menubar = {
            default: 'inactive',
            event: null,
        }
    }


    /**
    * Deal with menubar icon changes made to the store in
    * an environment-specific way.
    * @returns {Object} The store properties to watch.
    */
    _watchers() {
        return {
            'store.ui.menubar.default': (newVal, oldVal) => {
                if (this.app.env.isExtension) {
                    browser.browserAction.setIcon({path: `img/menubar-${newVal}.png`})
                }
            },
            'store.ui.menubar.event': (newVal, oldVal) => {
                if (this.app.env.isExtension) {
                    this.__menubarAnimation()
                    if (newVal) {
                        if (newVal === 'ringing') {
                            this.__menubarAnimation('ringing')
                        } else if (newVal === 'calling') {
                            browser.browserAction.setIcon({path: 'img/menubar-ringing-4.png'})
                        } else {
                            browser.browserAction.setIcon({path: `img/menubar-${newVal}.png`})
                        }

                    } else {
                        browser.browserAction.setIcon({path: `img/menubar-${this.app.state.ui.menubar.default}.png`})
                    }
                }
            },
        }
    }


    /**
    * Create a system notification. The type used depends on the OS. Linux
    * uses inotify by default. Note that we can't use buttons here, because
    * that would require a service-worker implementation.
    * @param {Object} opts - Notification options.
    * @param {Boolean} opts.force - Force to show the notification.
    * @param {String} opts.message - Message body for the notification.
    * @param {String} [opts.number] - Number is used to target specific click-to-dial labels.
    * @param {String} opts.title - Title header for the notification.
    * @param {Boolean} [opts.stack] - Whether to stack the notifications.
    */
    notification({force = false, message, number = null, title, stack = false, timeout = 3000}) {
        if (this.app.env.isNode) return

        const options = {
            message: message,
            title: title,
            type: 'basic',
        }
        options.iconUrl = 'img/notification.png'

        if (this.app.env.isExtension) {
            // Notify click-to-dial icon labels.
            if (number) {
                if (title) {
                    // Used to restore click-to-dial icon label state
                    // when reloading a tab page.
                    this.lastLabelMessage = {enabled: false, label: title, numbers: [number]}
                    this.app.modules.extension.tabs.signalIcons(this.lastLabelMessage)
                } else {
                    // No title is a reason to re-enable the target click-to-dial icon.
                    this.app.modules.extension.tabs.signalIcons({enabled: true, label: null, numbers: [number]})
                    this.lastLabelMessage = null
                }
            }

            // Only create a notification under the right conditions.
            if (!message || !title || (this.app.state.ui.visible && !force)) return

            options.iconUrl = browser.runtime.getURL(options.iconUrl)
            if (!stack) browser.notifications.clear('c2d')
            browser.notifications.create('c2d', options)
            setTimeout(() => browser.notifications.clear('c2d'), timeout)
            return
        }


        // Only create a notification under the right conditions.
        if (this.app.state.ui) {
            if (!message || !title || (this.app.state.ui.visible && !force)) return
        }

        options.icon = options.iconUrl
        options.body = message

        if (Notification.permission === 'granted') {
            if (!stack && this._notification) this._notification.close()
            this._notification = new Notification(title, options) // eslint-disable-line no-new
            setTimeout(() => this._notification.close(), timeout)
        } else if (Notification.permission !== 'denied') {
            // Create a notification after the user
            // accepted the permission.
            Notification.requestPermission((permission) => {
                if (permission === 'granted') {
                    this._notification = new Notification(title, options) // eslint-disable-line no-new
                    setTimeout(() => this._notification.close(), timeout)
                }
            })
        }
    }
}

module.exports = ModuleUI
