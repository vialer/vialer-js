/**
* @module ModuleSettings
*/
const Module = require('../lib/module')


/**
* Vialer-js settings module for `AppBackground`.
*/
class ModuleSettings extends Module {

    constructor(...args) {
        super(...args)
    }


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
                        {id: 1, name: 'opus'},
                        {id: 2, name: 'G722'},
                    ],
                    selected: {id: 1, name: 'opus'},
                },
                enabled: false,
                permission: false, // The microphone permission.
                sinks: {
                    input: {id: '', name: ''},
                    output: {id: '', name: ''},
                },
            },
        }
    }


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
