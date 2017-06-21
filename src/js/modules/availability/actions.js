'use strict'

const Actions = require('../../lib/actions')


/**
 * All UI related actions for Availability.
 */
class AvailabilityActions extends Actions {

    _background() {
        this.app.on('availability.select', (data) => {
            this.app.logger.debug(`${this}availability.select triggered`)
            this.module.selectUserdestination(data.type, data.id)
        })

        // Do the API call to notify the backend, then update the
        // choices in the  popup script.
        this.app.on('availability.update', (data) => {
            this.app.logger.debug(`${this}update selected userdestination and refresh popup`)
            this.module.selectUserdestination(data.type, data.id)
            this.app.emit('availability.refresh')
        })
    }


    _popup() {
        // Refresh the availability select.
        this.app.on('availability.refresh', (data) => {
            this.app.logger.debug(`${this}availability.refresh triggered`)
            this.module.toggleAvailabilitySelect()
        })

        // Empties the availability select.
        this.app.on('availability.reset', (data) => {
            this.app.logger.debug(`${this}availability.reset triggered`)
            let list = $('select#statusupdate')
            list.empty()

            // Add the unselected option.
            let option = $('<option value="">').text(this.app.translate('noAvailabilityOptionsText'))
            option.appendTo(list)
            // Which suggests you're not available (based on the available data:
            // no possible destinations).
            $('.availability-toggle [name="availability"][value="no"]').prop('checked', true)
            this.module.toggleAvailabilitySelect()
        })

        // Set the state of the availability select from the emitted data.
        this.app.on('availability.fill_select', (data) => {
            let isAvailable = 'no'
            let list = $('select#statusupdate')
            this.app.logger.debug(`${this}fill availability options`)
            list.empty()

            $.each(data.destinations, (index, destination) => {
                let option = $('<option>').val(destination.value).text(destination.label)
                if (destination.selected) {
                    this.app.logger.debug(`${this}selected ${destination.label}`)
                    $(option).prop('selected', true)
                    isAvailable = 'yes'
                }
                option.appendTo(list)
            })

            // Update the radiobuttons depending on whether a selected option was provided or not.
            $(`.availability-toggle [name="availability"][value="${isAvailable}"]`).prop('checked', true);
            // In turn, check whether to enable/disable the dropdown.
            this.module.toggleAvailabilitySelect()
        })

        /**
         * Change the user's availability.
         */
        $('.availability-toggle input[name="availability"]').change((e) => {
                // These values are used for val() == 'no' which clears the current destination.
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
            this.app.emit('availability.select', {id: selectedId, type: selectedType})
        })
    }


    toString() {
        return `${this.app} [AvailabilityActions] `
    }
}


module.exports = AvailabilityActions
