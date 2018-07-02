class Devices {
    /**
    * @param {AppBackground} app - The background application.
    */
    constructor(app) {
        this.app = app
        this.app.on('unlocked', this.verifySinks.bind(this))
        // Detect changes in connected devices while running.
        if (this.app.env.isBrowser) {
            navigator.mediaDevices.ondevicechange = async(event) => {
                // While the event handler is only registered once; it is triggered
                // twice in a row nevertheless. Skip the second call.
                const vaultUnlocked = this.app.state.app.vault.unlocked
                const mediaPermission = this.app.state.settings.webrtc.media.permission
                const isAuthenticated = this.app.state.user.authenticated

                if (!this._throttle && vaultUnlocked && mediaPermission && isAuthenticated) {
                    this._throttle = true
                    await this.verifySinks()
                    this._throttle = false
                }
            }
        }
    }


    /**
    * Compare stored sinks with sinks from the browser device list.
    * Indicates whether a device sink was added or removed, compared to
    * the stored device sinks.
    * @returns {Array} - Difference between browser and stored sink list.
    */
    compareSinks({input, output}) {
        // Find devices that are in the browser list, but not in store.
        let addedInputDevices = input.filter((i) => !this.cached.input.find((j) => i.id === j.id))
        let removedInputDevices = this.cached.input.filter((i) => !input.find((j) => i.id === j.id))

        let addedOutputDevices = output.filter((i) => !this.cached.output.find((j) => i.id === j.id))
        let removedOutputDevices = this.cached.output.filter((i) => !output.find((j) => i.id === j.id))

        return {
            added: addedInputDevices.concat(addedOutputDevices),
            removed: removedInputDevices.concat(removedOutputDevices),
        }
    }


    /**
    * Query for media devices. This must be done only after the
    * getUserMedia permission has been granted; otherwise the names
    * of the devices aren't returned, due to browser security restrictions.
    * @param {Boolean} difference - Difference between stored and queried devices.
    * @returns {Array} - Input and output devices.
    */
    async query(difference = false) {
        let devices
        let input = []
        let output = []
        try {
            devices = await navigator.mediaDevices.enumerateDevices()
        } catch (err) {
            console.error(err)
        }

        for (const device of devices) {
            if (device.id === 'default') device.label = this.app.$t('default').capitalize()
            if (device.kind === 'audioinput') {
                input.push({id: device.deviceId, name: device.label, valid: true})
            } else if (device.kind === 'audiooutput') {
                output.push({id: device.deviceId, name: device.label, valid: true})
            }
        }

        return {input, output}
    }


    /**
    * Generate a representational name for this module. Used for logging.
    * @returns {String} - An identifier for this module.
    */
    toString() {
        return `${this.app}[devices] `
    }


    /**
    * Verify that the devices selected as sink are still
    * available in the the browser's device list.
    * @param {Object} options - Options to pass.
    * @param {Array} options.input - Input devices that were queried.
    * @param {Array} options.output - Output devices that were queried.
    * @returns {Boolean} - Valid or not.
    */
    validateSinks({input, output}) {
        const browserSinks = {input, output}
        let storedDevices = this.app.utils.copyObject({input: this.cached.input, output: this.cached.output})
        this.sinks = this.app.state.settings.webrtc.devices.sinks
        let valid = true

        for (const sinkName of Object.keys(this.sinks)) {
            const sink = this.sinks[sinkName]
            const sinkType = sinkName.endsWith('Input') ? 'input' : 'output'
            if (sink.id === 'default') continue

            let storedDevice = storedDevices[sinkType].find((i) => i.id === sink.id)
            if (!storedDevice) {
                // The stored sink is not in the stored input/output options
                // anymore. Add the missing option to the stored device list.
                this.app.logger.debug(`${this}restoring sink '${sink.name}'`)
                storedDevice = sink
                storedDevice.valid = true
                storedDevices[sinkType].push(storedDevice)
            }
            // Selected input sink is not in the browser device list.
            // Mark the device invalid and mark whole validation as
            // invalid.
            if (!browserSinks.input.find((i) => i.id === sink.id) && !browserSinks.output.find((i) => i.id === sink.id)) {
                this.app.logger.debug(`${this}sink '${sink.name}' is gone`)
                storedDevice.valid = false
                valid = false
            }
        }

        storedDevices.ready = valid
        this.app.setState(storedDevices, {path: 'settings.webrtc.devices'})
        this.app.logger.debug(`${this}validated sinks (${valid})`)
        return valid
    }


    /**
    * Validates the sinks and steers the user to the audio settings
    * page when one of the sinks is incorrectly set.
    */
    async verifySinks() {
        this.cached = this.app.utils.copyObject({
            input: this.app.state.settings.webrtc.devices.input,
            output: this.app.state.settings.webrtc.devices.output,
        })

        const {input, output} = await this.query()

        if (!this.cached.input.length || !this.cached.output.length) {
            this.app.logger.debug(`${this}no sinks stored yet; store query list`)
            // No sinks stored before; fill the output and input device options.
            this.app.setState({settings: {webrtc: {devices: {input, output}}}}, {persist: true})
        } else {
            const sinkChange = this.compareSinks({input, output})
            this.app.logger.debug(`${this}sink(s) added:\n${sinkChange.added.map((i) => i.name).join('\n')}`)
            this.app.logger.debug(`${this}sink(s) removed:\n${sinkChange.removed.map((i) => i.name).join('\n')}`)
            // Always notify about a newly connected device.
            if (sinkChange.added.length) {
                const message = this.app.$t('new audio device detected.')
                this.app.notify({icon: 'info', message, type: 'info'})
            }

            // There are options available; verify if the selected sinks are valid.
            if (this.validateSinks({input, output})) {
                if (sinkChange.removed.length) {
                    const message = this.app.$t('unused audio device was removed.')
                    this.app.notify({icon: 'warning', message, type: 'warning'})
                }
                // Only overwrite the device list when the current device
                // is in the actual device list; so we can add a validation
                // error on the non-existing device.
                this.app.setState({settings: {webrtc: {devices: {input, output}}}}, {persist: true})
            } else {
                const message = this.app.$t('selected audio device is not available.')
                this.app.notify({icon: 'warning', message, type: 'danger'})
                this.app.setState({ui: {layer: 'settings', tabs: {settings: {active: 'audio'}}}})
            }
        }
    }
}

module.exports = Devices
