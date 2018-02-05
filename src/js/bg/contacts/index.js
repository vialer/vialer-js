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
            state: null,
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
        this.app.setState({contacts: {contacts: {}, state: 'loading'}})
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

        this.app.setState({contacts: {state: null}})

        this.app.logger.debug(`${this}retrieved ${contacts.length} contacts`)

        for (let contactData of contacts) {
            this.contacts[contactData.account_id] = new ContactSip(this.app, contactData)
        }
    }


    toString() {
        return `${this.app}[contacts] `
    }
}

module.exports = ContactsModule
