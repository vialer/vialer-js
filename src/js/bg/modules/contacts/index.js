/**
* @module ModuleContacts
*/
const ContactSip = require('./contact/sip')
const Module = require('../../lib/module')


class ModuleContacts extends Module {
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
            status: null,
        }
    }


    /**
    * Retrieve all contacts frm the VoIPGRID platform API.
    * @param {Boolean} refresh - True when the plugin is forced to refresh.
    */
    async _platformData() {
        this.app.setState({}, {action: 'replace', path: 'contacts/contacts'})
        this.app.setState({contacts: {contacts: {}, status: 'loading'}})
        const res = await this.app.api.client.get('api/phoneaccount/basic/phoneaccount/?active=true&order_by=description')
        if (this.app.api.NOTOK_STATUS.includes(res.status)) {
            if (this.app.api.UNAUTHORIZED_STATUS.includes(res.status)) {
                this.app.setState({contacts: {widget: {status: 'unauthorized'}}})
            }
            return
        }

        // Remove the user's own account from the list.
        const ownAccountId = parseInt(this.app.state.settings.webrtc.account.selected.username)
        let contacts = res.data.objects.filter((c) => (c.account_id !== ownAccountId))

        this.app.setState({contacts: {status: null}})

        this.app.logger.debug(`${this}retrieved ${contacts.length} contacts`)

        for (let contactData of contacts) {
            this.contacts[contactData.account_id] = new ContactSip(this.app, contactData)
        }

        if (['registered', 'connected'].includes(this.app.state.calls.ua.state)) {
            for (let contactId of Object.keys(this.contacts)) {
                if (this.contacts[contactId].presence) await this.contacts[contactId].presence.subscribe()
            }
        }
    }


    _restoreState(moduleStore) {
        moduleStore.contacts = {}
    }


    toString() {
        return `${this.app}[contacts] `
    }
}

module.exports = ModuleContacts
