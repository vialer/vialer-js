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
                    active: 'general',
                },
            },
            visible: false,
        }
    }


    _restoreState(moduleStore) {
        moduleStore.menubar = {
            default: 'inactive',
            event: null,
        }
    }


    _watchers() {
        return {
            /**
            * Deal with all menubar icon changes for dnd.
            * TODO: Add logic for Electron icon changes.
            * @param {String} newVal - The new dnd icon value.
            * @param {String} oldVal - The old dnd icon value.
            */
            'store.availability.dnd': (newVal, oldVal) => {
                if (this.app.env.isExtension) {
                    // Dnd is set. Set the menubar to inactive.
                    if (newVal) browser.browserAction.setIcon({path: 'img/menubar-unavailable.png'})
                    // Restore the previous value.
                    else browser.browserAction.setIcon({path: 'img/menubar-active.png'})
                }
            },
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
