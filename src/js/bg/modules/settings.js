/**
* This module takes care of dealing with all
* settings and responding to changes to it.
* @module ModuleSettings
*/
const Module = require('../lib/module')


/**
* Main entrypoint for Settings.
* @memberof AppBackground.modules
*/
class ModuleSettings extends Module {
    /**
    * Initializes the module's store.
    * All application runtime settings are defined here. Build-time
    * settings go in the ``~/.vialer-jsrc` file.
    * @returns {Object} The module's store properties.
    */
    _initialState() {
        return {
            click2dial: {
                blacklist: [],
                enabled: true,
            },
            language: {
                options: [
                    {id: 'nl', name: 'Dutch'},
                    {id: 'en', name: 'English'},
                ],
                selected: {id: 'nl', name: 'Dutch'},
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
                enabled: null, // Three values; null(not decided), false(disable), true(enable)
            },
            vault: {
                active: false,
                key: null,
                salt: null,
                store: false,
                unlocked: false,
            },
            webrtc: {
                account: {
                    options: [], // Platform integration provides these choices.
                    password: '',
                    selected: {
                        id: null,
                        password: null,
                        username: null,
                    },
                },
                codecs: {
                    options: [
                        {id: 1, name: 'G722'},
                    ],
                    selected: {id: 1, name: 'G722'},
                },
                enabled: false,
                media: {
                    devices: {
                        input: {
                            options: [],
                            selected: {
                                id: null,
                                name: null,
                            },
                        },
                        output: {
                            options: [],
                            selected: {
                                id: null,
                                name: null,
                            },
                        },
                    },
                    permission: false,
                    type: {
                        options: [
                            {id: 'AUDIO_NOPROCESSING', name: 'Audio without processing'},
                            {id: 'AUDIO_PROCESSING', name: 'Audio with processing'},
                        ],
                        selected: {id: 'AUDIO_NOPROCESSING', name: 'Audio without processing'},
                    },
                },
            },
        }
    }


    /**
    * Respond to changes in settings, like storing the Vault key,
    * send a telemetry event when Telemetry is switched on or off,
    * toggle the Click-to-dial icon observer, etc..
    * @returns {Object} The store properties to watch.
    */
    _watchers() {
        return {
            'store.settings.click2dial.enabled': (newVal, oldVal) => {
                if (this.app.env.isExtension) {
                    this.app.modules.extension.tabs.signalIcons({enabled: newVal})
                }
            },
            'store.settings.telemetry.enabled': (newVal, oldVal) => {
                this.app.emit('bg:telemetry:event', {eventAction: 'toggle', eventLabel: newVal, eventName: 'telemetry', override: true})
            },
            'store.settings.vault.store': (newVal, oldVal) => {
                if (newVal) this.app.crypto.storeVault()
                else {
                    this.app.setState({settings: {vault: {key: null}}}, {encrypt: false, persist: true})
                }
            },
            'store.settings.webrtc.enabled': (newVal, oldVal) => {
                this.app.emit('bg:tabs:update_contextmenus', {}, true)
            },
        }
    }
}

module.exports = ModuleSettings
