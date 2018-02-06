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
                sinks: {
                    input: {id: '', name: ''},
                    output: {id: '', name: ''},
                },
                username: '',
            },
        }
    }
}

module.exports = SettingsModule
