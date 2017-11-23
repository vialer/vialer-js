/**
 * @module Contacts
 */
class ContactsModule {

    constructor(app) {
        this.app = app
        this.addListeners()
    }


    addListeners() {
        let _$ = {}
        _$.widget = $('.widget.contacts')
        _$.list = _$.widget.find('.widget-item-list.list')
        _$.emptyList = _$.widget.find('.widget-item-list.empty')
        _$.notFoundList = _$.widget.find('.widget-item-list.not-found')
        _$.searchInput = _$.widget.find('.search input')
        _$.statusIndicators = _$.widget.find('.status-indicators')

        // Get the synced SIP websocket connection status from localstorage.
        // Show the disconnected icon at startup when the websocket is
        // not yet started.
        if (this.app.store.get('sip') && this.app.store.get('sip').status !== 'started') {
            _$.widget.find('.disconnected-status').removeClass('hide')
        }

        this.app.on('dialer:status.stop', (data) => {
            _$.widget.find('.widget-item').attr('disabled', false)
        })

        this.app.on('contacts:empty', (data) => {
            _$.emptyList.removeClass('hide')
            _$.searchInput.attr('disabled', 'disabled')
        })

        // Fill the contact list.
        this.app.on('contacts:fill', (data) => {
            let contacts = data.contacts
            _$.emptyList.addClass('hide')
            _$.notFoundList.addClass('hide')

            // Empty list, then fill.
            _$.list.empty()
            let template = _$.widget.find('template').contents()
            $.each(contacts, function(index, contact) {
                let listItem = template.clone()
                listItem.attr('id', `sip${contact.account_id}`)
                listItem.find('.name').text(contact.description)
                listItem.find('.description').text(contact.internal_number)
                listItem.appendTo(_$.list)
            })

            _$.searchInput.removeAttr('disabled')

            // Trigger the callback function to receive presence data
            // after the list is fully built.
            data.callback({})

            // Open the contacts widget after it's filled,
            // so it's open by default in the popout. Also after a refresh.
            if (this.app.env.isExtension && this.app.env.role.popout) {
                const widgetElement = this.app.modules.ui.getWidget('contacts')
                $(widgetElement).data('opened', true).attr('data-opened', true)
            }
        })


        // Disable the search input when refreshing the widgets.
        this.app.on('ui:mainpanel.loading', () => {
            _$.searchInput.val('').attr('disabled', 'disabled')
        })

        this.app.on('contacts:reset', (data) => {
            _$.list.empty()
            _$.emptyList.addClass('hide')
            // Reset search.
            _$.searchInput.val('')
        })


        this.app.on('sip:before_start', () => {
            _$.statusIndicators.find('i').addClass('hide').filter('.disconnected-status').removeClass('hide')
        })

        this.app.on('sip:starting', (e) => {
            _$.statusIndicators.find('i').addClass('hide').filter('.disconnected-status').removeClass('hide')
        })

        this.app.on('sip:failed_to_start', (data) => {
            _$.statusIndicators.find('i').addClass('hide').filter('.disconnected-status').removeClass('hide')
        })

        this.app.on('sip:started', () => {
            _$.statusIndicators.find('.disconnected-status').addClass('hide')
        })

        this.app.on('sip:stopped', (e) => {
            // Hide all other status indicators as well.
            _$.statusIndicators.find('i').addClass('hide').filter('.disconnected-status').removeClass('hide')
            // Remove all the statuses from the contacts.
            _$.widget.find('.icon').removeClass('available unavailable busy ringing shake')
        })

        /**
         * Show a blinking presence loading icon while updating.
         */
        this.app.on('sip:presences.start_update', (data) => {
            _$.statusIndicators.find('.updating-presence-status').removeClass('hide')
        })

        /**
        * Update the status of each account in the contact list when it's
        * available.
        */
        this.app.on('sip:presence.update', (data) => {
            $(`#sip${data.account_id} .icon`)
                .removeClass('available unavailable busy ringing shake')
                .addClass(data.state)
        })

        /**
        * Hide the sip presence update indicator when the update
        * process is done.
        */
        this.app.on('sip:presences.updated', (data) => {
            _$.statusIndicators.find('.updating-presence-status').addClass('hide')
        })

        /**
         * Requests to call the clicked contact.
         */
        _$.widget.on('click', '.contact', (e) => {
            if ($(e.currentTarget).attr('disabled')) {
                e.preventDefault()
                return
            } else {
                // Disable all contacts during call initiatition.
                _$.widget.find('.widget-item').attr('disabled', true)
            }

            let extension = $(e.currentTarget).find('.description').text()
            let forceSilent = false
            // The sender will be a tab when sending this event from the popout.
            // Use the `forceSilent` flag in this case, so callstatus
            // updates are send through notifications, instead of a modal.
            if (this.app.env.isExtension && this.app.env.role.popout) forceSilent = true
            this.app.emit('dialer:dial', {
                analytics: 'Colleagues',
                b_number: extension,
                forceSilent: forceSilent,
            })
        })

        // Search through contacts while typing.
        _$.searchInput.keyup((e) => {
            const searchQuery = $(e.currentTarget).val().trim().toLowerCase()
            // Filter list.
            let rowOdd = 0
            let $widgetItems = _$.list.find('.widget-item')
            if (searchQuery === '') {
                $widgetItems.removeClass('odd even hide')
            }

            $.each($widgetItems, (index, contact) => {
                // Hide contact if not a match.
                const nameText = $(contact).find('.name').text().toLowerCase()
                const extensionText = $(contact).find('.description').text().toLowerCase()
                // No search result. Hide the item.
                if (nameText.indexOf(searchQuery) === -1 && extensionText.indexOf(searchQuery) === -1) {
                    $(contact).removeClass('odd').removeClass('even')
                    $(contact).addClass('hide')
                } else {
                    $(contact).removeClass('hide')
                    if (rowOdd % 2 === 0) {
                        $(contact).removeClass('even').addClass('odd')
                    } else {
                        $(contact).removeClass('odd').addClass('even')
                    }
                    rowOdd += 1
                }
            })

            let $lastVisibleItem = $widgetItems.filter(':visible:last')
            // Show a message if no contacts matched.
            if ($lastVisibleItem.length) {
                _$.notFoundList.addClass('hide')
            } else {
                _$.notFoundList.removeClass('hide')
            }
        })
    }
}

module.exports = ContactsModule
