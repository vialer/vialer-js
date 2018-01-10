/**
 * @module Contacts
 */
class ContactsModule {

    constructor(app) {
        this.app = app

        // Get the synced SIP websocket connection status from localstorage.
        // Show the disconnected icon at startup when the websocket is
        // not yet started.
        if (this.app.store.get('sip') && this.app.store.get('sip').status !== 'started') {
            this.app.state.contacts.sip.state = 'disconnected'
        }

        this.app.on('dialer:status.stop', (data) => {
            for (let contact of this.app.state.contacts.contacts) {
                contact.state = 'disabled'
            }
        })

        this.app.on('contacts:empty', (data) => {
            this.app.state.contacts.contacts = []
        })

        this.app.on('contacts:reset', (data) => {
            this.app.state.contacts.contacts = []
            this.app.state.contacts.search.input = ''
        })


        /**
        * Hide the sip presence update indicator when the update
        * process is done.
        */
        this.app.on('sip:presences.updated', (data) => {
            this.app.state.contacts.search.disabled = false
            this.app.state.contacts.sip.state = 'ready'
        })
    }
}

module.exports = ContactsModule
