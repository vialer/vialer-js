/**
* Extension-specific background module takes care of dealing
* with WebExtension specifics like handling install/update
* actions, interacting with `AppTab` and setup keyboard
* shortcuts.
* @module ModuleExtension
*/
const Module = require('../../lib/module')
const Tabs = require('./tabs')


/**
* Main entrypoint for Extension.
* @memberof AppBackground.modules
*/
class ModuleExtension extends Module {
    /**
    * Add listeners for update/install actions and
    * setup keyboard events.
    * @param {AppBackground} app - The background application.
    */
    constructor(app) {
        super(app)

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
                this.app.setState({
                    app: {
                        installed: true,
                        updated: false,
                        version: {
                            current: chrome.runtime.getManifest().version,
                        },
                    },
                }, {encrypt: false, persist: true})
            } else if (details.reason === 'update') {
                this.app.setState({
                    app: {
                        installed: false,
                        updated: true,
                        version: {
                            current: chrome.runtime.getManifest().version,
                            previous: details.previousVersion,
                        },
                    },
                }, {encrypt: false, persist: true})
            }
        })
    }


    /**
    * Add keyboard commands. See `manifest.json`
    * for the supported keyboard shortcuts.
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


    /**
    * Setup a browser Tabs handler after the background
    * application signalled it is ready.
    */
    _ready() {
        this.tabs = new Tabs(this.app)
    }

}

module.exports = ModuleExtension
