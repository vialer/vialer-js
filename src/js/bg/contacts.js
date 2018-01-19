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
                this.app.setState({contacts: {widget: {state: 'unauthorized'}}}, false)
            }
            return
        }

        let contacts = res.data.objects
        console.log("LENGTH:", contacts.length)
        this.lookup.contacts = new Map(contacts.map((c) => [c.account_id, c]))
        this.app.logger.debug(`${this}updating contacts list(${contacts.length})`)

        // Remove accounts that are not currently registered
        // to a device.

        contacts = contacts.filter((c) => c.sipreginfo)
        this.app.setState({contacts: {contacts: contacts}})
        if (contacts.length) this.app.sip.updatePresence()
    }


    toString() {
        return `${this.app}[contacts] `
    }
}

module.exports = ContactsModule
