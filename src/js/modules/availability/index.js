'use strict'

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
     * Build an array of availability data that can be used to build
     * the availability select.
     */
    availabilityOptions(userdestination, selectedFixeddestinationId, selectedPhoneaccountId) {
        this.app.logger.info(`${this}availabilityOptions selected [${selectedFixeddestinationId}, ${selectedPhoneaccountId}]`)
        // Destinations choices.
        let fixeddestinations = userdestination.fixeddestinations
        let phoneaccounts = userdestination.phoneaccounts

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
        let content = {
            fixeddestination: null,
            phoneaccount: null,
        }
        if (type) {
            content[type] = id
        }

        // Save selection.
        let selecteduserdestinationUrl = this.app.api.getUrl('selecteduserdestination') + this.app.store.get('user').selectedUserdestinationId + '/'
        this.app.api.asyncRequest(selecteduserdestinationUrl, content, 'put', {
            onOk: () => {
                this.app.logger.info(`${this}selected userdestination api request ok`)

                // Set an icon depending on whether the user is available or not.
                let icon = 'build/img/call-red.png'
                if (id) {
                    icon = 'build/img/call-green.png'
                }
                let widgetsData = this.app.store.get('widgets')
                widgetsData.availability.icon = icon
                this.app.store.set('widgets', widgetsData)
                if (widgetsData.queues && !widgetsData.queues.selected) {
                    chrome.browserAction.setIcon({path: icon})
                }
                let userData = this.app.store.get('user')
                userData.userdestination.selecteduserdestination.fixeddestination = content.fixeddestination
                userData.userdestination.selecteduserdestination.phoneaccount = content.phoneaccount
                this.app.store.set('user', userData)
            },
            onNotOk: () => {
                // Jump back to previously selected (the one currently in cache).
                this.restore()
                // FIXME: Show a notification something went wrong?
            },
            onUnauthorized: () => {
                // Jump back to previously selected (the one currently in cache)
                this.restore()
                // FIXME: Show a notification something went wrong?
            },
        })
    }


    /**
     * Do an API request to get an update of the available userdestination
     * options when the module is loaded in the background.
     */
    load() {
        if (!this.app.env.extension.background) {
            return
        }
        this.app.api.asyncRequest(this.app.api.getUrl('userdestination'), null, 'get', {
            onComplete: () => {
                this.app.emit('widget.indicator.stop', {name: 'availability'})
            },
            onOk: (response) => {
                this.app.emit('availability.reset')
                // There is only one userdestination so objects[0] is the right (and only) one.
                let userdestination = response.objects[0]
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
                let widgetsData = this.app.store.get('widgets')
                widgetsData.availability.options = options
                widgetsData.availability.unauthorized = false
                this.app.store.set('widgets', widgetsData)

                // Fill the dropdown with these choices.
                if (options.length) {
                    this.app.emit('availability.fill_select', {destinations: options})
                }

                // Set an icon depending on whether the user is available or not.
                let icon = 'build/img/call-red.png'
                if (selectedFixeddestinationId || selectedPhoneaccountId) {
                    icon = 'build/img/call-green.png'
                }
                this.app.logger.info(`${this}setting icon ${icon}`)
                if (!widgetsData.queues.selected) {
                    chrome.browserAction.setIcon({path: icon})
                }

                // Save icon in storage.
                widgetsData.availability.icon = icon
                this.app.store.set('widgets', widgetsData)
            },
            onUnauthorized: () => {
                this.app.logger.warn(`${this}unauthorized availability request`)
                // Update authorization status in the store.
                let widgetsData = this.app.store.get('widgets')
                widgetsData.availability.unauthorized = true
                this.app.store.set('widgets', widgetsData)

                // Display an icon explaining the user lacks permissions to use
                // this feature of the plugin.
                this.app.emit('widget.unauthorized', {name: 'availability'})
            },
        })
    }


    reset() {
        this.app.emit('availability.reset')
        this.app.logger.info(`${this}set icon to grey`)
        chrome.browserAction.setIcon({path: 'build/img/call-gray.png'})
    }


    /**
     * This is called when the popup refreshes and the background already
     * has processed all availability data.
     */
    restore() {
        this.app.logger.info(`${this}restoring widget availability`)

        // Check if unauthorized.
        let widgetsData = this.app.store.get('widgets')
        if (widgetsData.availability.unauthorized) {
            this.app.emit('widget.unauthorized', {name: name})
            return
        }

        // Restore options.
        let userData = this.app.store.get('user')
        if (userData) {
            let userdestination = userData.userdestination
            let selectedFixeddestinationId = userdestination.selecteduserdestination.fixeddestination
            let selectedPhoneaccountId = userdestination.selecteduserdestination.phoneaccount
            this.app.logger.debug(`${this}restoring availability options from ${selectedPhoneaccountId}/${selectedFixeddestinationId}`)
            let options = this.availabilityOptions(userdestination, selectedFixeddestinationId, selectedPhoneaccountId)
            this.app.emit('availability.reset')
            if (options.length) {
                this.app.emit('availability.fill_select', {destinations: options})
            }
        }

        // Restore icon.
        if (widgetsData.availability.icon) {
            if (!widgetsData.queues.selected) {
                this.app.logger.info(`${this}set availability icon`)
                chrome.browserAction.setIcon({path: widgetsData.availability.icon})
            }
        }

        // Restore availability.
        this.app.emit('availability.refresh')
    }


    toString() {
        return `${this.app} [Availability]       `
    }
}

module.exports = AvailabilityModule
