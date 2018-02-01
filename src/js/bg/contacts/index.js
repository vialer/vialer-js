const ContactSip = require('./contact/sip')
const Module = require('../lib/module')


/**
 * @module Contacts
 */
class ContactsModule extends Module {
    /**
    * @param {ClickToDialApp} app - The application object.
    */
    constructor(...args) {
        super(...args)

        this.contacts = {}
    }


    _initialState() {
        return {
            contacts: {},
            search: {
                disabled: false,
                input: '',
            },
        }
    }


    _restoreState(moduleStore) {
        moduleStore.contacts = {}
    }


    /**
    * Retrieve all contacts frm the VoIPGRID platform API.
    * @param {Boolean} refresh - True when the plugin is forced to refresh.
    */
    async getApiData() {
        this.app.setState({contacts: {contacts: {}}}, {persist: true})
        const res = await this.app.api.client.get('api/phoneaccount/basic/phoneaccount/?active=true&order_by=description')
        if (this.app.api.NOTOK_STATUS.includes(res.status)) {
            if (this.app.api.UNAUTHORIZED_STATUS.includes(res.status)) {
                this.app.setState({contacts: {widget: {state: 'unauthorized'}}})
            }
            return
        }

        // Remove unregistered accounts and the user's own account.
        const ownAccountId = parseInt(this.app.state.settings.webrtc.username)
        let contacts = res.data.objects.filter((c) => {
            return (c.sipreginfo && (c.account_id !== ownAccountId))
        })

        this.app.logger.debug(`${this}retrieved ${contacts.length} contacts`)

        for (let contactData of contacts) {
            this.contacts[contactData.account_id] = new ContactSip(this.app, contactData)
        }

        // const contactsLookup = new Map(contacts.map((c) => [c.account_id, c]))
        // const cachedContactsLookup = new Map(this.app.state.contacts.contacts.map((c) => [c.account_id, c]))

        // contacts = contacts.map((c) => {
        //     c.state = null
        //     const cachedContact = cachedContactsLookup.get(c.account_id)
        //     if (cachedContact) c.state = cachedContact.state
        //     else c.state = null
        //     return c
        // })

        // Remove accounts that are not currently registered to a device.

        // let invalidContacts = []
        // let cachedContacts = this.app.state.contacts.contacts
        // for (let cachedContact of cachedContacts) {
        //     if (!contactsLookup.get(cachedContact.account_id)) invalidContacts.push(cachedContact)
        // }
        //
        // for (const contact of invalidContacts) {
        //     this.app.sip.presence.unsubscribe(contact.account_id)
        // }

        // this.app.setState({contacts: {contacts: contacts}}, {persist: false})
        // if (Object.keys(this.contacts).length) this.app.modules.calls.presence.update()
    }


    toString() {
        return `${this.app}[contacts] `
    }
}

module.exports = ContactsModule
