/**
 * @module Contacts
 */
class ContactsModule {
    /**
    * @param {ClickToDialApp} app - The application object.
    */
    constructor(app) {
        this.app = app

        this.app.modules.contacts = this
        if (app.state.user.authenticated) this._load()
    }


    /**
    * Functionality to load for this module.
    * @param {Boolean} refresh - True when the plugin is forced to refresh.
    */
    _load(refresh) {
        this.app.api.client.get('api/phoneaccount/basic/phoneaccount/?active=true&order_by=description').then((res) => {
            if (this.app.api.OK_STATUS.includes(res.status)) {
                let contacts = res.data.objects
                this.app.logger.debug(`${this}updating contacts list(${contacts.length})`)

                // Remove accounts that are not currently registered
                // to a device.
                for (let i = contacts.length - 1; i >= 0; i--) {
                    if (!contacts[i].hasOwnProperty('sipreginfo')) contacts.splice(i, 1)
                }

                this.app.state.contacts.contacts = contacts
                this.app.state.contacts.widget.state = ''

                this.app.emit('fg:set_state', {
                    contacts: {
                        contacts: this.app.state.contacts.contacts,
                        widget: this.app.state.contacts.widget,
                    },
                })

                if (contacts.length) this.app.sip.updatePresence(refresh)

            } else if (this.app.api.NOTOK_STATUS.includes(res.status)) {
                if (this.app.api.UNAUTHORIZED_STATUS.includes(res.status)) {
                    this.app.emit('fg:set_state', {contacts: {widget: {state: 'unauthorized'}}})
                }
            }
        })
    }


    toString() {
        return `${this.app}[contacts] `
    }
}

module.exports = ContactsModule
