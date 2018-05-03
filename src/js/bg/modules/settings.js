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
                blacklist: [
                    '^chrome',
                    // we prefer not to add icons in documents
                    '^https?.*docs\\.google\\.com.*$',
                    '^https?.*drive\\.google\\.com.*$',
                    // Pages on these websites tend to grow too large to parse them in
                    // a reasonable amount of time.
                    '^https?.*bitbucket\\.org.*$',
                    '^https?.*github\\.com.*$',
                    '^https?.*rbcommons\\.com.*$',
                    // This site has at least tel: support and uses javascript to open
                    // a new web page when clicking the anchor element wrapping the
                    // inserted icon.
                    '^https?.*slack\\.com.*$',
                ],
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
                sentryDsn: process.env.SENTRY_DSN,
            },
            webrtc: {
                account: {
                    options: [], // Platform integration provides these choices.
                    password: '',
                    selected: {id: null, password: null, username: null},
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
                            selected: {id: null, name: null},
                        },
                        output: {
                            options: [],
                            selected: {id: null, name: null},
                        },
                        sounds: {
                            options: [],
                            selected: {id: null, name: null},
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
            wizard: {
                completed: false,
                step: 0,
            },
        }
    }


    /**
    * Refresh the devices list when this plugin is started, but
    * only if the Vault is unlocked, because the devices list is
    * stored in the encrypted part of the store, which should be
    * available at that point. An additional vault unlock watcher
    * is used to refresh the devices list when auto unlocking is
    * disabled.
    */
    _ready() {
        const vaultUnlocked = this.app.state.app.vault.unlocked
        const mediaPermission = this.app.state.settings.webrtc.media.permission
        const isAuthenticated = this.app.state.user.authenticated

        if (vaultUnlocked && mediaPermission && isAuthenticated) {
            this.queryMediaDevices()
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
            'store.settings.click2dial.enabled': (enabled) => {
                if (this.app.env.isExtension) {
                    this.app.modules.extension.tabs.signalIcons({enabled})
                }
            },
            'store.settings.telemetry.enabled': (enabled) => {
                if (enabled) {
                    this.app.logger.info(`${this}start raven exception monitoring`)
                    Raven.config(this.app.state.settings.telemetry.sentryDsn, {
                        allowSecretKey: true,
                        environment: process.env.DEPLOY_TARGET,
                        release: this.app.state.app.version.current,
                    }).install()
                } else {
                    this.app.logger.info(`${this}stop raven exception monitoring`)
                    Raven.uninstall()
                }
                this.app.emit('bg:telemetry:event', {eventAction: 'toggle', eventLabel: enabled, eventName: 'telemetry', override: true})
            },
            'store.settings.webrtc.enabled': () => {
                this.app.emit('bg:tabs:update_contextmenus', {}, true)
            },
            /**
            * Read the devices list as soon there is media permission
            * and the user is authenticated. The devices list is stored
            * in the encrypted part, so the vault must be open at this point.
            */
            'store.settings.webrtc.media.permission': () => {
                if (this.app.state.user.authenticated) this.queryMediaDevices()
            },
        }
    }


    /**
    * Generate a representational name for this module. Used for logging.
    * @returns {String} - An identifier for this module.
    */
    toString() {
        return `${this.app}[settings] `
    }


    /**
    * Query for media devices. This must be done only after the
    * getUserMedia permission has been granted; otherwise the names
    * of the devices aren't returned, due to browser security restrictions.
    */
    async queryMediaDevices() {
        try {
            const devices = await navigator.mediaDevices.enumerateDevices()
            let inputOptions = []
            let outputOptions = []
            for (const device of devices) {
                if (device.kind === 'audioinput') {
                    inputOptions.push({id: device.deviceId, name: device.label})
                } else if (device.kind === 'audiooutput') {
                    outputOptions.push({id: device.deviceId, name: device.label})
                }
            }

            this.app.setState({
                settings: {
                    webrtc: {
                        media: {
                            devices: {
                                input: {options: inputOptions},
                                output: {options: outputOptions},
                                sounds: {options: outputOptions},
                            },
                        },
                    },
                },
            }, {persist: true})
        } catch (err) {
            console.error(err)
        }
    }
}

module.exports = ModuleSettings
