const Module = require('./lib/module')


/**
* @module UserInterfaceModule
*/
class UiModule extends Module {

    constructor(...args) {
        super(...args)
    }

    _initialState() {
        return {
            layer: 'login',
            menubar: {
                icon: 'menubar-inactive',
            },
            tabs: {
                settings: {
                    active: 'general',
                },
            },
            visible: false,
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
            'store.ui.menubar.icon': (newVal, oldVal) => {
                if (this.app.env.isExtension) {
                    browser.browserAction.setIcon({path: `img/icon-${newVal}.png`})
                }
            },
        }
    }
}

module.exports = UiModule
