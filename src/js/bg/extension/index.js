const Module = require('../lib/module')


const Tabs = require('./tabs')

/**
* Root class for all extension-related logic.
*/
class Extension extends Module {

    constructor(...args) {
        super(...args)


        // Check whether new version is installed
        browser.runtime.onInstalled.addListener((details) => {
            // Note that console logging doesn't work within this event.
            if (details.reason === 'install') {
                this.app.state.ui.installed = true
                this.app.setState({
                    extension: {
                        installed: true,
                    },
                    ui: {
                        version: {
                            current: chrome.runtime.getManifest().version,
                        },
                    },
                }, {persist: true})
            } else if (details.reason === 'update') {
                this.app.setState({
                    extension: {
                        updated: true,
                    },
                    ui: {
                        version: {
                            current: chrome.runtime.getManifest().version,
                            previous: details.previousVersion,
                        },
                    },
                }, {persist: true})
            }
        })
    }

    _initialState() {
        return {
            installed: false,
            updated: false,
        }
    }

    _ready() {
        this.tabs = new Tabs(this.app)
    }

}

module.exports = Extension
