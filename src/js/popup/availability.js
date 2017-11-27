/**
* @module Availability
*/
class AvailabilityModule {

    /**
    * @param {ClickToDialApp} app - The application object.
    */
    constructor(app) {
        this.app = app
        this.addListeners()
    }


    addListeners() {
        // Refresh the availability select.
        this.app.on('availability:refresh', (data) => {
            this.toggleAvailabilitySelect()
        })

        // Empties the availability select.
        this.app.on('availability:reset', (data) => {
            let list = $('select#statusupdate')
            list.empty()

            // Add the unselected option.
            let option = $('<option value="">').text(this.app.i18n.translate('noAvailabilityOptionsText'))
            option.appendTo(list)
            // Which suggests you're not available (based on the available data:
            // no possible destinations).
            $('.availability-toggle [name="availability"][value="no"]').prop('checked', true)
            this.toggleAvailabilitySelect()
        })

        /**
         * Set the state of the availability select from the emitted data.
         * This is either done after an API call or from a cached restore.
         */
        this.app.on('availability:fill_select', (data) => {
            let isAvailable = 'no'
            let list = $('select#statusupdate')
            this.app.logger.debug(`${this}fill availability options`)
            list.empty()

            data.destinations.forEach((destination, index) => {
                const option = $('<option>').val(destination.value).text(destination.label)
                if (destination.selected) {
                    this.app.logger.debug(`${this}selected ${destination.label}`)
                    $(option).prop('selected', true)
                    isAvailable = 'yes'
                }
                option.appendTo(list)
            })

            // Update the radiobuttons depending on whether a selected option
            // was provided.
            $(`.availability-toggle [name="availability"][value="${isAvailable}"]`).prop('checked', true)
            // In turn, check whether to enable/disable the dropdown.
            this.toggleAvailabilitySelect()
        })

        /**
         * Change the user's availability by setting the selected
         * userdestination to null(not available) or to the selected
         * userdestination.
         */
        $('.availability-toggle input[name="availability"]').change((e) => {
            // These values are used for val() == 'no' which clears the
            // current destination.
            let selectedType = null
            let selectedId = null

            if ($(e.currentTarget).val() === 'yes') {
                // Selects the first destination by default.
                [selectedType, selectedId] = $('[name="selecteddestination"] option:selected').val().split('-')
            }

            this.app.emit('availability.update', {id: selectedId, type: selectedType})
        })

        /**
         * Change the user's destination.
         */
        $('select#statusupdate').change((e) => {
            let [selectedType, selectedId] = $(e.currentTarget).find('option:selected').val().split('-')
            this.app.emit('availability.update', {id: selectedId, type: selectedType})
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
