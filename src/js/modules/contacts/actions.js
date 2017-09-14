/**
* @module Contacts
*/
const Actions = require('../../lib/actions')


/**
* Actions for the Contacts module.
*/
class ContactsActions extends Actions {

    toString() {
        return `${this.module}[actions] `
    }


    /**
    * Register local events; e.g. events that are triggered
    * from the background and handled by the background.
    */
    _background() {
        this.app.on('sip:failed_to_start', (e) => {
            let widgetState = this.app.store.get('widgets')
            widgetState.contacts.status = 'failed_to_start'
            this.app.store.set('widgets', widgetState)
        })

        this.app.on('sip:started', (e) => {
            let widgetState = this.app.store.get('widgets')
            widgetState.contacts.status = 'connected'
            this.app.store.set('widgets', widgetState)
            const accountIds = widgetState.contacts.list.map((c) => c.account_id)
            this.app.sip.updatePresence(accountIds, true)
        })

        this.app.on('sip:starting', (e) => {
            let widgetState = this.app.store.get('widgets')
            widgetState.contacts.status = 'connecting'
            this.app.store.set('widgets', widgetState)
        })

        this.app.on('sip:stopped', (e) => {
            let widgetState = this.app.store.get('widgets')
            if (widgetState) {
                widgetState.contacts.status = 'disconnected'
                this.app.store.set('widgets', widgetState)
            }
        })
    }


    _popup() {
        // The SIP websocket connection is not started at this point.
        // Show the disconnected icon.
        $('.contacts .disconnected-status').css('display', 'inline-block')

        this.app.on('dialer:status.stop', (data) => {
            $('.contacts').find('.contact').attr('disabled', false)
        })

        // Force size for .contact,
        // useful in case of a popout and the list of contacts
        // is larger in size (height) than the viewport.
        function resizeContacts(reset) {
            let pluginWidth = $('.container').outerWidth()
            $('body.expand .contact').css('width', pluginWidth)
        }
        resizeContacts()
        $(window).resize(resizeContacts)

        this.app.on('contacts:empty', (data) => {
            $('.widget.contacts .empty-list').removeClass('hide')
            $('.contacts .search-query').attr('disabled', 'disabled')
        })

        // Fill the contact list.
        this.app.on('contacts:fill', (data) => {
            let contacts = data.contacts
            $('.widget.contacts .empty-list').addClass('hide')
            $('.widget.contacts .not-found-contacts').addClass('hide')
            $('.contacts .search-query').removeAttr('disabled')

            // Clear list.
            let list = $('.contacts .list')
            list.empty()

            // Fill list.
            let template = $('.contacts .template .contact')
            $.each(contacts, function(index, contact) {
                let listItem = template.clone()
                listItem.attr('id', 'sip' + contact.account_id)
                listItem.find('.name').text(contact.description)
                listItem.find('.extension').text(contact.internal_number)
                listItem.appendTo(list)
            })

            // Hack in popout to display bottom border.
            $('.contacts .list .contact:visible:last').addClass('last')
            // Trigger the callback function to receive presence data
            // after the list is fully built.
            data.callback({})
            // Hide element.
            $('embed').hide()

            // Open the contacts widget after it's filled,
            // so it's open by default in the popout.
            if (this.app.env.extension && this.app.env.extension.popout) {
                this.app.modules.ui.openWidget('contacts')
            }
        })

        this.app.on('contacts:reset', (data) => {
            let list = $('.contacts .list')
            list.empty()
            $('.widget.contacts .empty-list').addClass('hide')

            // Reset search.
            $('.search-form :input').val('')
            $('.widget.contacts .contact').removeClass('hide')
        })


        this.app.on('sip:before_start', () => {
            $('.contacts .disconnected-status').css('display', 'inline-block')
        })

        this.app.on('sip:starting', (e) => {
            $('.contacts .disconnected-status').css('display', 'inline-block')
        })

        this.app.on('sip:failed_to_start', (data) => {
            $('.contacts .disconnected-status').css('display', 'inline-block')
            $('.contacts .status-indicator').hide().filter('.disconnected-status').css('display', 'inline-block')
        })

        this.app.on('sip:started', () => {
            $('.contacts .disconnected-status').hide()
        })

        this.app.on('sip:stopped', (e) => {
            // Hide all other status indicators as well.
            $('.contacts .status-indicator').hide()
            $('.contacts .disconnected-status').css('display', 'inline-block')
            // Remove all the statuses from the contacts.
            $('.contacts .status-icon').removeClass('available unavailable busy ringing shake')
        })

        /**
         * Show a blinking presence loading icon while updating.
         */
        this.app.on('sip:presences.start_update', (data) => {
            $('.contacts .disconnected-status').hide()
            $('.contacts .updating-presence-status').css('display', 'inline-block')
            // Remove all statuses from the contacts.
            $('.contacts .status-icon').removeClass('available unavailable busy ringing shake')
        })

        /**
        * Update the status of each account in the contact list when it's
        * available.
        */
        this.app.on('sip:presence.update', (data) => {
            $(`#sip${data.account_id} .status-icon`)
                .removeClass('available unavailable busy ringing shake')
                .addClass(data.state)
        })

        /**
        * Hide the sip presence update indicator when the update
        * process is done.
        */
        this.app.on('sip:presences.updated', (data) => {
            $('.contacts .updating-presence-status').hide()
        })

        // Call a contact when clicking on one.
        $('.contacts').on('click', '.status-icon, .name, .extension', (e) => {
            const $contact = $(e.currentTarget).closest('.contact')

            if ($contact.attr('disabled')) {
                e.preventDefault()
                return
            } else {
                // Disable all contacts during initiating a call.
                $('.contacts').find('.contact').attr('disabled', true)
            }

            let extension = $contact.find('.extension').text()
            if (extension && extension.length) {
                let forceSilent = false
                // When sending this event from the popout, the sender
                // will be a tab. Use the `forceSilent` flag to forcefully
                // disable callstatus notifications.
                if (this.app.env.extension && this.app.env.extension.popout) forceSilent = true
                this.app.emit('dialer:dial', {
                    analytics: 'Colleagues',
                    b_number: extension,
                    forceSilent: forceSilent,
                })
            }
        })

        // Search through contacts while typing.
        const list = $('.contacts .list')
        $('.search-form :input').keyup((e) => {
            let searchQuery = $(e.currentTarget).val().trim().toLowerCase()
            $(list).find('.contact.last').removeClass('last')
            // Filter list.
            let rowOdd = 0
            if (searchQuery === '') {
                $('.contacts .list .contact').removeClass('odd even hide')
            } else {
                $.each($('.contacts .list .contact'), (index, contact) => {
                    // Hide contact if not a match.
                    const nameText = $(contact).find('.name').text().toLowerCase()
                    const extensionText = $(contact).find('.extension').text().toLowerCase()
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
            }
            $('.contacts .list .contact:visible:last').addClass('last')
            // Show a message if no contacts matched.
            if ($('.contacts .list .contact:visible').length) {
                $('.widget.contacts .not-found-contacts').addClass('hide')
            } else {
                $('.widget.contacts .not-found-contacts').removeClass('hide')
            }
        }).keydown((e) => {
            // Don't submit this form on enter.
            if (e.which === 13) {
                e.preventDefault()
            }
        })
    }
}

module.exports = ContactsActions
