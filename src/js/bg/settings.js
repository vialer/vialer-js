const Module = require('./lib/module')

/**
* @module Settings
*/
class SettingsModule extends Module {

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
                enabled: false,
            },
            webrtc: {
                enabled: false,
                password: '',
                permission: false, // The microphone permission.
                sinks: {
                    input: {id: '', name: ''},
                    output: {id: '', name: ''},
                },
                username: '',
            },
        }
    }


    _watchers() {
        return {
            'store.settings.click2dial.enabled': (newVal, oldVal) => {
                if (this.app.env.isExtension) {
                    this.app.extension.tabs.toggleIcons(newVal)
                }
            },
            'store.settings.webrtc.enabled': (newVal, oldVal) => {
                this.app.emit('bg:tabs:update_contextmenus', {}, true)
            },
        }
    }
}

module.exports = SettingsModule
