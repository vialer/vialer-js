const AvailabilityActions = require('./actions')


/**
 * A meaningful description.
 */
class AvailabilityModule {

    /**
     * @param {ClickToDialApp} app - The application object.
     */
    constructor(app) {
        this.app = app
        this.app.modules.availability = this
        this.actions = new AvailabilityActions(app, this)
    }


    /**
     * Do an API request to get an update of the available userdestination
     * options when the module is loaded in the background.
     */
    _load() {
        if (this.app.env.extension && !this.app.env.extension.background) return

        this.app.api.client.get('api/userdestination/').then((res) => {
            this.app.emit('ui:widget.reset', {name: 'availability'})
            if (this.app.api.OK_STATUS.includes(res.status)) {
                this.app.emit('availability:reset')
                // There is only one userdestination so objects[0] is the right
                // (and only) one.
                let userdestination = res.data.objects[0]
                let userData = this.app.store.get('user')
                if (userData) {
                     // Save userdestination in storage.
                    userData.userdestination = userdestination
                    // Save id for reference when changing the userdestination.
                    userData.selectedUserdestinationId = userdestination.selecteduserdestination.id
                    this.app.store.set('user', userData)
                }

                // Currently selected destination.
                let selectedFixeddestinationId = userdestination.selecteduserdestination.fixeddestination
                let selectedPhoneaccountId = userdestination.selecteduserdestination.phoneaccount

                // Build options for the availability dropdown.
                let options = this.availabilityOptions(userdestination, selectedFixeddestinationId, selectedPhoneaccountId)
                let widgetState = this.app.store.get('widgets')
                widgetState.availability.options = options
                widgetState.availability.unauthorized = false
                this.app.store.set('widgets', widgetState)

                // Fill the dropdown with these choices.
                if (options.length) {
                    this.app.emit('availability:fill_select', {destinations: options})
                }

                // Set an icon depending on whether the user is available or not.
                let icon = 'img/call-red.png'
                if (selectedFixeddestinationId || selectedPhoneaccountId) {
                    icon = 'img/call-green.png'
                }
                this.app.logger.info(`${this}setting icon ${icon}`)

                if (this.app.env.extension) {
                    if (!widgetState.queues.selected) {
                        this.app.browser.browserAction.setIcon({path: icon})
                    }
                }

                // Save icon in storage.
                widgetState.availability.icon = icon
                this.app.store.set('widgets', widgetState)
            } else if (this.app.api.UNAUTHORIZED_STATUS.includes(res.status)) {
                this.app.logger.warn(`${this}unauthorized availability request`)
                // Update authorization status in the store.
                let widgetState = this.app.store.get('widgets')
                widgetState.availability.unauthorized = true
                this.app.store.set('widgets', widgetState)

                // Display an icon explaining the user lacks permissions to use
                // this feature of the plugin.
                this.app.emit('ui:widget.unauthorized', {name: 'availability'})
            }
        })
    }


    _reset() {
        this.app.emit('availability:reset')
        this.app.logger.info(`${this}set icon to grey`)
        if (this.app.env.extension) this.app.browser.browserAction.setIcon({path: 'img/call-gray.png'})
    }


    /**
     * This is called when the popup refreshes and the background already
     * has processed all availability data.
     */
    _restore() {
        // Check if unauthorized.
        const widgetState = this.app.store.get('widgets')
        if (widgetState && widgetState.availability.unauthorized) {
            this.app.emit('ui:widget.unauthorized', {name: 'availability'})
            return
        }

        // Restore options.
        const userData = this.app.store.get('user')
        if (userData && userData.userdestination) {
            const userdestination = userData.userdestination
            const selectedFixeddestinationId = userdestination.selecteduserdestination.fixeddestination
            const selectedPhoneaccountId = userdestination.selecteduserdestination.phoneaccount
            this.app.logger.debug(`${this}restoring availability options from ${selectedPhoneaccountId}/${selectedFixeddestinationId}`)
            const options = this.availabilityOptions(userdestination, selectedFixeddestinationId, selectedPhoneaccountId)
            this.app.emit('availability:reset')
            if (options.length) {
                this.app.emit('availability:fill_select', {destinations: options})
            }
        }

        // Restore icon.
        if (widgetState && widgetState.availability.icon) {
            if (!widgetState.queues.selected) {
                this.app.logger.info(`${this}set availability icon`)
                if (this.app.env.extension) {
                    this.app.browser.browserAction.setIcon({path: widgetState.availability.icon})
                }
            }
        }

        // Restore availability.
        this.app.emit('availability:refresh')
    }


    /**
     * Build an array of availability data that can be used to build
     * the availability select.
     */
    availabilityOptions(userdestination, selectedFixeddestinationId, selectedPhoneaccountId) {
        this.app.logger.info(`${this}availabilityOptions selected [${selectedFixeddestinationId}, ${selectedPhoneaccountId}]`)
        // Destinations choices.
        const fixeddestinations = userdestination.fixeddestinations
        const phoneaccounts = userdestination.phoneaccounts

        let options = []
        fixeddestinations.forEach((fixeddestination) => {
            let option = {
                value: `fixeddestination-${fixeddestination.id}`,
                label: `${fixeddestination.phonenumber}/${fixeddestination.description}`,
            }
            if (parseInt(fixeddestination.id) === parseInt(selectedFixeddestinationId)) {
                this.app.logger.debug(`${this}set selected fixeddestination ${selectedFixeddestinationId}`)
                option.selected = true
            }
            // Add fixed destination to options.
            options.push(option)
        })
        phoneaccounts.forEach((phoneaccount) => {
            let option = {
                value: `phoneaccount-${phoneaccount.id}`,
                label: `${phoneaccount.internal_number}/${phoneaccount.description}`,
            }
            if (parseInt(phoneaccount.id) === parseInt(selectedPhoneaccountId)) {
                this.app.logger.debug(`${this}set selected phoneaccount ${selectedPhoneaccountId}`)
                option.selected = true
            }
            // Add phone account to options.
            options.push(option)
        })

        return options
    }


    selectUserdestination(type, id) {
        let data = {
            fixeddestination: null,
            phoneaccount: null,
        }
        if (type) data[type] = id

        // Save selection.
        let selectedUserdestinationId = this.app.store.get('user').selectedUserdestinationId

        this.app.api.client.put(`api/selecteduserdestination/${selectedUserdestinationId}/`, data)
        .then((res) => {
            if (this.app.api.OK_STATUS.includes(res.status)) {
                this.app.logger.info(`${this}changed selected userdestination api request ok`)

                // Set an icon depending on whether the user is available or not.
                let icon = 'img/call-red.png'
                if (id) {
                    icon = 'img/call-green.png'
                }
                let widgetState = this.app.store.get('widgets')
                widgetState.availability.icon = icon
                this.app.store.set('widgets', widgetState)

                if (this.app.env.extension) {
                    if (widgetState.queues && !widgetState.queues.selected) {
                        this.app.browser.browserAction.setIcon({path: icon})
                    }
                }

                let userData = this.app.store.get('user')
                userData.userdestination.selecteduserdestination.fixeddestination = data.fixeddestination
                userData.userdestination.selecteduserdestination.phoneaccount = data.phoneaccount
                this.app.store.set('user', userData)
            } else if (this.app.api.NOTOK_STATUS.includes(res.status)) {
                this._restore()
            }
        })
    }


    /**
     * Enable or disable the availability select based on the
     * `Are you available` radio button value.
     */
    toggleAvailabilitySelect() {
        const isAvailable = $('.availability-toggle [name="availability"]:checked').val() === 'yes'
        if (isAvailable) {
            this.app.logger.debug(`${this}user is available`)
            $('select#statusupdate').prop('disabled', false)
        } else {
            this.app.logger.debug(`${this}user is not available`)
            $('select#statusupdate').prop('disabled', true)
        }
    }


    toString() {
        return `${this.app}[availability] `
    }
}

module.exports = AvailabilityModule
