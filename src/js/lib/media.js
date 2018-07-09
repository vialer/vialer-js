/**
* UserMedia related class that interacts with Vialer-js
* and the getUserMedia API. The `getUserMedia` call with
* WebExtensions is rather cumbersome. The background script
* can only check the permission, while the foreground script
* triggers an actual request to the user to modify the
* permission. The browser UI status is updated after every
* call to getUserMedia, that's why we use a poller here to
* keep the media status up-to-date.
*/
class Media {

    constructor(app) {
        this.app = app

        if (this.app.env.isBrowser) {
            // Create audio/video elements in a browser-like environment.
            // The audio element is used to playback sounds with
            // (like ringtones, dtmftones). The video element is
            // used to attach the remote WebRTC stream to.
            this.localVideo = document.createElement('video')
            this.localVideo.setAttribute('id', 'local')
            this.localVideo.muted = true

            this.remoteVideo = document.createElement('video')
            this.remoteVideo.setAttribute('id', 'remote')
            document.body.prepend(this.localVideo)
            document.body.prepend(this.remoteVideo)

            // Trigger play automatically. This is required for any audio
            // to play during a call.
            this.remoteVideo.addEventListener('canplay', () => this.remoteVideo.play())
            this.localVideo.addEventListener('canplay', () => this.localVideo.play())
        }
    }


    /**
    * Return the getUserMedia flags based on the user's settings.
    * @returns {Object} - Supported flags for getUserMedia.
    */
    _getUserMediaFlags() {
        const presets = {
            AUDIO_NOPROCESSING: {
                audio: {
                    echoCancellation: false,
                    googAudioMirroring: false,
                    googAutoGainControl: false,
                    googAutoGainControl2: false,
                    googEchoCancellation: false,
                    googHighpassFilter: false,
                    googNoiseSuppression: false,
                    googTypingNoiseDetection: false,
                },
            },
            AUDIO_PROCESSING: {
                audio: {},
            },
        }

        const userMediaFlags = presets[this.app.state.settings.webrtc.media.type.selected.id]
        const inputSink = this.app.state.settings.webrtc.devices.sinks.headsetInput.id

        if (inputSink && inputSink !== 'default') {
            userMediaFlags.audio.deviceId = inputSink
        }
        return userMediaFlags
    }


    /**
    * The getUserMedia permission change doesn't have an event. Instead, the
    * media devices are queried by this poller for every x ms. This is done in
    * the foreground to keep the permission UI in-line and up-to-date. The
    * background uses the same poller to update some properties on a permission
    * change - like the device list - regardless whether the UI is shown.
    * 500 ms should be a right balance between responsiveness and a slight
    * performance loss.
    */
    poll() {
        this.intervalId = setInterval(async() => {
            // Only do this when being authenticated; e.g. when there
            // is an active state container around.
            if (this.app.state.user.authenticated) {
                try {
                    await this.query()
                    // Early device query.
                    if (this.app.env.section.bg && !this.app.devices.cached) {
                        await this.app.devices.verifySinks()
                    }
                } catch (err) {
                    console.error(err)
                    // An exception means something else than a lack of permission.
                    clearInterval(this.intervalId)
                }
            }
        }, 500)
    }


    /**
    * Silently try to initialize media access, unless the error is not
    * related to a lack of permission.
    */
    async query() {
        // Check media permission at the start of the bg/fg.
        if (this.app.env.isFirefox || this.app.env.isNode) {
            this.app.setState({settings: {webrtc: {media: {permission: false}}}})
            return
        }

        try {
            await navigator.mediaDevices.getUserMedia(this._getUserMediaFlags())
            this.__failedShutdown = false
            this.__failedShutdownFresh = false
            if (!this.app.state.settings.webrtc.media.permission) {
                this.app.setState({settings: {webrtc: {media: {permission: true}}}})
            }
        } catch (err) {
            // There are no devices at all. Spawn a warning.
            if (err.message === 'Requested device not found') {
                if (this.app.env.section.fg) {
                    this.app.notify({icon: 'warning', message: this.app.$t('no audio devices found.'), type: 'warning'})
                }
                throw new Error(err)
            }

            // This error also may be triggered when there are no devices
            // at all. The browser sometimes has issues finding any devices.
            if (this.app.state.settings.webrtc.media.permission) {
                this.app.setState({settings: {webrtc: {media: {permission: false}}}})
            }
        }
    }
}

module.exports = Media
