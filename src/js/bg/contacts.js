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

        this.app.modules.contacts = this
        if (app.state.user.authenticated) this.getApiData()
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
        this.lookup.contacts = new Map(contacts.map((c) => [c.account_id, c]))
        this.app.logger.debug(`${this}updating contacts list(${contacts.length})`)

        // Remove accounts that are not currently registered
        // to a device.
        for (let i = contacts.length - 1; i >= 0; i--) {
            if (!contacts[i].hasOwnProperty('sipreginfo')) contacts.splice(i, 1)
        }

        this.app.state.contacts.contacts = contacts
        this.app.state.contacts.widget.state = ''

        this.app.setState({
            contacts: {
                contacts: this.app.state.contacts.contacts,
                widget: this.app.state.contacts.widget,
            },
        }, true)

        if (contacts.length) this.app.sip.updatePresence()
    }


    toString() {
        return `${this.app}[contacts] `
    }
}

module.exports = ContactsModule
