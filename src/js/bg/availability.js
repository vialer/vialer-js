/**
* @module Availability
*/
class AvailabilityModule {

    /**
    * @param {ClickToDialApp} app - The application object.
    */
    constructor(app) {
        this.app = app
        this.app.modules.availability = this

        /**
         * Update availability by calling the API, then emit
         * to the popup that the choices need to be updated.
         */
        this.app.on('availability.update', async(data) => {
            this.app.logger.debug(`${this}update selected userdestination`)
            // Save selection.
            let selectedUserdestinationId = this.app.state.availability.userdestination.selecteduserdestination.id
            const res = await this.app.api.client.put(`api/selecteduserdestination/${selectedUserdestinationId}/`, {
                fixeddestination: data.type === 'fixeddestination' ? data.id : null,
                phoneaccount: data.type === 'phoneaccount' ? data.id : null,
            })

            if (this.app.api.NOTOK_STATUS.includes(res.status)) {
                this._restore()
            }

            // Set an icon depending on whether the user is available.
            let icon = 'img/icon-menubar-unavailable.png'
            if (data.id) {
                icon = 'img/icon-menubar-active.png'
            }
            this.app.state.availability.icon = icon

            if (this.app.env.isExtension) {
                if (!this.app.state.queues.selectedQueue) {
                    browser.browserAction.setIcon({path: icon})
                }
            }

            this.app.setState({
                availability: {
                    userdestination: {
                        selecteduserdestination: {
                            fixeddestination: data.type === 'fixeddestination' ? data.id : null,
                            phoneaccount: data.type === 'phoneaccount' ? data.id : null,
                        },
                    },
                },
            }, true)
        })
    }


    /**
    * Build an array of availability data that can be used to build
    * the availability select.
    * @param {Object} userdestination - Contains available phoneaccounts and
    * fixeddestinations to build the availability list from.
    * @param {String} selectedFixeddestinationId - Fixeddestination to select.
    * @param {String} selectedPhoneaccountId - Phoneaccount to select.
    * @returns {Array} - Data that is used to build the select element with.
    */
    _availabilityOptions(userdestination, selectedFixeddestinationId, selectedPhoneaccountId) {
        this.app.logger.info(
            `${this}availabilityOptions selected [${selectedFixeddestinationId}, ${selectedPhoneaccountId}]`)
        // Destinations choices.
        const fixeddestinations = userdestination.fixeddestinations
        const phoneaccounts = userdestination.phoneaccounts

        let options = []
        let selected = null
        fixeddestinations.forEach((fixeddestination) => {
            let option = {
                label: `${fixeddestination.phonenumber}/${fixeddestination.description}`,
                value: `fixeddestination-${fixeddestination.id}`,
            }
            if (parseInt(fixeddestination.id) === parseInt(selectedFixeddestinationId)) {
                this.app.logger.debug(`${this}set selected fixeddestination ${selectedFixeddestinationId}`)
                option.selected = true
                selected = option.value
            }
            // Add fixed destination to options.
            options.push(option)
        })
        phoneaccounts.forEach((phoneaccount) => {
            let option = {
                label: `${phoneaccount.internal_number}/${phoneaccount.description}`,
                value: `phoneaccount-${phoneaccount.id}`,
            }
            if (parseInt(phoneaccount.id) === parseInt(selectedPhoneaccountId)) {
                this.app.logger.debug(`${this}set selected phoneaccount ${selectedPhoneaccountId}`)
                option.selected = true
                selected = option.value
            }
            // Add phone account to options.
            options.push(option)
        })

        return {
            options,
            selected: selected,
        }
    }


    /**
    * Do an API request to get an update of the available userdestination
    * options when the module is loaded in the background.
    */
    async getApiData() {
        const res = await this.app.api.client.get('api/userdestination/')

        if (this.app.api.UNAUTHORIZED_STATUS.includes(res.status)) {
            this.app.logger.warn(`${this}unauthorized availability request`)
            this.app.state.availability.widget.state = 'unauthorized'
            this.app.emit('fg:set_state', {availability: {widget: {state: 'unauthorized'}}})
            return
        }

        // There is only one userdestination so objects[0] is the right
        // (and only) one.
        let userdestination = res.data.objects[0]

        // Currently selected destination.
        let selectedFixeddestinationId = userdestination.selecteduserdestination.fixeddestination
        let selectedPhoneaccountId = userdestination.selecteduserdestination.phoneaccount

        this.app.setState({availability: {userdestination}}, true)

        // Set an icon depending on whether the user is available.
        let icon = 'img/icon-menubar-unavailable.png'
        if (selectedFixeddestinationId || selectedPhoneaccountId) {
            icon = 'img/icon-menubar-active.png'
        }

        if (this.app.env.isExtension) {
            this.app.logger.info(`${this}setting icon ${icon}`)
            if (!this.app.state.queues.selectedQueue) {
                browser.browserAction.setIcon({path: icon})
            }
        }

        // Save icon in storage, so we can restore the icon state without
        // getting API data.
        this.app.state.availability.icon = icon

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
