/**
 * @module Contacts
 */
class ContactsModule {
    /**
    * @param {ClickToDialApp} app - The application object.
    */
    constructor(app) {
        this.app = app
        this.lookup = {}
    }


    /**
    * Retrieve all contacts frm the VoIPGRID platform API.
    * @param {Boolean} refresh - True when the plugin is forced to refresh.
    */
    async getApiData() {
        const res = await this.app.api.client.get('api/phoneaccount/basic/phoneaccount/?active=true&order_by=description')
        if (this.app.api.NOTOK_STATUS.includes(res.status)) {
            if (this.app.api.UNAUTHORIZED_STATUS.includes(res.status)) {
                this.app.setState({contacts: {widget: {state: 'unauthorized'}}})
            }
            return
        }

        // Filter non-registered accounts and the user's own account
        // from the contact list.
        const ownAccountId = parseInt(this.app.state.settings.webrtc.username)
        let contacts = res.data.objects.filter((c) => {
            return (c.sipreginfo && (c.account_id !== ownAccountId))
        })

        this.app.logger.debug(`${this}updating contacts list(${contacts.length})`)

        const contactsLookup = new Map(contacts.map((c) => [c.account_id, c]))
        const cachedContactsLookup = new Map(this.app.state.contacts.contacts.map((c) => [c.account_id, c]))

        contacts = contacts.map((c) => {
            const cachedContact = cachedContactsLookup.get(c.account_id)
            if (cachedContact) c.state = cachedContact.state
            else c.state = null
            return c
        })

        // Remove accounts that are not currently registered
        // to a device.

        let invalidContacts = []
        let cachedContacts = this.app.state.contacts.contacts
        for (let cachedContact of cachedContacts) {
            if (!contactsLookup.get(cachedContact.account_id)) invalidContacts.push(cachedContact)
        }

        for (const contact of invalidContacts) {
            this.app.sip.presence.unsubscribe(contact.account_id)
        }

        this.app.setState({contacts: {contacts: contacts}}, {persist: true})
        if (contacts.length) this.app.sip.presence.update()
    }


    toString() {
        return `${this.app}[contacts] `
    }
}

module.exports = ContactsModule
