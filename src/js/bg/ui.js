const Module = require('./lib/module')


/**
* @module UserInterfaceModule
*/
class UiModule extends Module {

    constructor(...args) {
        super(...args)
        this.animationStep = 0
        this.animations = {
            ringing: {
                direction: 1,
                frame: 0,
                frames: 5,
                intervalId: null,
            },
        }
        // Used to restore the label message state when a tab refreshes
        // and a call is still ongoing.
        this.lastLabelMessage = null
    }


    _initialState() {
        return {
            layer: 'login',
            menubar: {
                default: 'inactive',
                event: null,
            },
            tabs: {
                settings: {
                    active: 'phone',
                },
            },
            visible: false,
        }
    }


    _hydrateState(moduleStore) {
        moduleStore.menubar = {
            default: 'inactive',
            event: null,
        }
    }


    _watchers() {
        return {
            /**
            * Deal with all menubar icon changes for extensions.
            * TODO: Add logic for Electron icon changes.
            * @param {String} newVal - The new menubar icon value.
            * @param {String} oldVal - The old menubar icon value.
            */
            'store.ui.menubar.default': (newVal, oldVal) => {
                if (this.app.env.isExtension) {
                    browser.browserAction.setIcon({path: `img/menubar-${newVal}.png`})
                }
            },
            'store.ui.menubar.event': (newVal, oldVal) => {
                if (this.app.env.isExtension) {
                    this.menubarAnimation()
                    if (newVal) {
                        if (newVal === 'ringing') {
                            this.menubarAnimation('ringing')
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
    * @param {String} opts.title - Title header for the notification.
    * @param {String} opts.message - Message body for the notification
    * @param {String} [opts.number] - Number is used to target specific click-to-dial labels.
    * @param {Boolean} [opts.stack] - Whether to stack the notifications.
    */
    notification({message, number = null, title, stack = false}) {
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

            // Only create a notification with a message and a title.
            if (!message || !title) return

            options.iconUrl = browser.runtime.getURL(options.iconUrl)
            if (!stack) browser.notifications.clear('c2d')
            browser.notifications.create('c2d', options)
            setTimeout(() => browser.notifications.clear('c2d'), 3000)
            return
        }


        // Only create a notification with a message and a title.
        if (!message || !title) return

        options.icon = options.iconUrl
        options.body = message

        if (Notification.permission === 'granted') {
            if (!stack && this._notification) this._notification.close()
            this._notification = new Notification(title, options) // eslint-disable-line no-new
            setTimeout(this._notification.close.bind(this._notification), 3000)
        } else if (Notification.permission !== 'denied') {
            // Create a notification after the user
            // accepted the permission.
            Notification.requestPermission((permission) => {
                if (permission === 'granted') {
                    this._notification = new Notification(title, options) // eslint-disable-line no-new
                    setTimeout(this._notification.close.bind(this._notification), 3000)
                }
            })
        }
    }


    menubarAnimation(name) {
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
}

module.exports = UiModule
