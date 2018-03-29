/**
* The Contacts module is currently vendor-specific,
* but is supposed to be a generic way of dealing with
* a user's contact-options. Therefor a Contact can have
* multiple endpoints, which are ways to contact the Contact.
* An endpoint can be a CallSip or other class inheriting from
* the base Call class.
* @module ModuleContacts
*/
const ContactSip = require('./contact/sip')
const Module = require('../../lib/module')


/**
* Main entrypoint for Contacts.
* @memberof AppBackground.modules
*/
class ModuleContacts extends Module {
    /**
    * @param {AppBackground} app - The background application.
    */
    constructor(app) {
        super(app)

        this.contacts = {}
    }


    /**
    * Initializes the module's store.
    * @returns {Object} The module's store properties.
    */
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

        if (['registered', 'connected'].includes(this.app.state.calls.ua.status)) {
            for (let contactId of Object.keys(this.contacts)) {
                if (this.contacts[contactId].presence) await this.contacts[contactId].presence.subscribe()
            }
        }
    }


    /**
    * Restore stored dumped state from localStorage.
    * @param {Object} moduleStore - Root property for this module.
    */
    _restoreState(moduleStore) {
        moduleStore.contacts = {}
    }


    /**
    * Generate a representational name for this module. Used for logging.
    * @returns {String} - An identifier for this module.
    */
    toString() {
        return `${this.app}[contacts] `
    }
}

module.exports = ModuleContacts
