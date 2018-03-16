const Module = require('../../lib/module')
const Tabs = require('./tabs')


/**
* Root class for all extension-related logic.
*/
class Extension extends Module {

    constructor(...args) {
        super(...args)

        this._installUpdate()
        this._keyboardShortcuts()
    }


    /**
    * Respond to install and update actions of the webextension.
    */
    _installUpdate() {
        browser.runtime.onInstalled.addListener((details) => {
            // Note that console logging doesn't work within this event.
            if (details.reason === 'install') {
                this.app.state.app.installed = true
                this.app.setState({
                    app: {
                        installed: true,
                        version: {
                            current: chrome.runtime.getManifest().version,
                        },
                    },
                }, {persist: true})
            } else if (details.reason === 'update') {
                this.app.setState({
                    app: {
                        updated: true,
                        version: {
                            current: chrome.runtime.getManifest().version,
                            previous: details.previousVersion,
                        },
                    },
                }, {persist: true})
            }
        })
    }


    /**
    * Add keyboard commands for the webextension. See manifest.json
    * for the keyboard shortcuts.
    */
    _keyboardShortcuts() {
        browser.commands.onCommand.addListener((command) => {
            if (command === 'action-accept-new') {
                this.app.modules.calls.callAction('accept-new')
            } else if (command === 'action-decline-hangup') {
                this.app.modules.calls.callAction('decline-hangup')
            } else if (command === 'action-dnd') {
                // Only toggle when calling options are enabled and webrtc is enabled.
                if (!this.app.helpers.callingDisabled() && this.app.state.settings.webrtc.enabled) {
                    this.app.setState({availability: {dnd: !this.app.state.availability.dnd}})
                }
            } else if (command === 'action-hold-active') {
                this.app.modules.calls.callAction('hold-active')
            }
        })
    }


    _ready() {
        this.tabs = new Tabs(this.app)
    }

}

module.exports = Extension
