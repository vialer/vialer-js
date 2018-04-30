/**
* The Contacts module is currently vendor-specific,
* but is supposed to be a generic way of dealing with
* a user's contact-options. Therefor a Contact can have
* multiple endpoints, which are ways to contact the Contact.
* An endpoint can be a CallSip or other class inheriting from
* the base Call class.
* @module ModuleContacts
*/
const Contact = require('./contact')
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
        // Holds Contact instances, not Contact state.
        this.contacts = {}

        this.app.on('bg:user:logged_out', () => {
            this.contacts = {}
            this.app.setState({}, {action: 'replace', path: 'contacts.contacts'})
        })
    }


    /**
    * Initializes the module's store.
    * @returns {Object} The module's store properties.
    */
    _initialState() {
        return {
            contacts: {},
            displayMode: 'lean',
            filters: {
                favorites: false,
            },
            search: {
                disabled: false,
                input: '',
            },
            status: null,
        }
    }


    /**
    * Load all endpoint data from the vendor platform API and mix
    * and update existing or create new conctacts.
    */
    async _platformData() {
        this.app.setState({contacts: {status: 'loading'}})
        const res = await this.app.api.client.get('api/phoneaccount/basic/phoneaccount/?active=true&order_by=description')
        if (this.app.api.NOTOK_STATUS.includes(res.status)) {
            this.app.logger.warn(`${this}platform data request failed (${res.status})`)
            return
        }

        // Remove the user's own account from the list.
        const ownAccountId = parseInt(this.app.state.settings.webrtc.account.selected.username)

        let voipaccounts = res.data.objects.filter((i) => (i.account_id !== ownAccountId))
        this.app.logger.debug(`${this}retrieved ${voipaccounts.length} endpoints`)
        this._syncEndpoints(voipaccounts)
        this.app.setState({contacts: {status: null}})
        // Subscribe here, so we are able to wait before a subscription
        // is completed until going to the next. This prevents the
        // server from being hammered.
        for (let contactId of Object.keys(this.contacts)) {
            if (['registered', 'connected'].includes(this.app.state.calls.ua.status)) {
                const endpoints = this.contacts[contactId].endpoints
                for (let endpointId of Object.keys(endpoints)) {
                    if (endpoints[endpointId].presence) {
                        await endpoints[endpointId].presence.subscribe()
                    }
                }
            }
        }
    }


    /**
    * State that is bound to a Class is more complicated to
    * restore when Vue & Vue-stash are already  initialized.
    * This happens when a user unlocks.
    * @param {Object} moduleStore - Root property for this module.
    */
    _restoreState(moduleStore) {
        let contacts = moduleStore.contacts
        if (this.app.vm) {
            // The user unlocks; start with an empty placeholder
            // and rebuild the contacts from reinitializing Contact
            // instaces.
            if (moduleStore.contacts) {
                // Keep the contacts from being restored in the store.
                contacts = JSON.parse(JSON.stringify(moduleStore.contacts))
                moduleStore.contacts = {}
            }
        }

        if (contacts) {
            for (const id of Object.keys(contacts)) {
                if (!this.contacts[id]) {
                    this.contacts[id] = new Contact(this.app, contacts[id])
                }
            }
        }

        Object.assign(moduleStore, {status: 'ready'})
    }


    /**
    * Compare, updates and creates Contact instances with appropriate state
    * from VoIP-accounts that are listed under a client on
    * the VoIPGRID platform.
    * @param {Array} voipaccounts - The endpoints to check against.
    */
    _syncEndpoints(voipaccounts) {
        let contacts = this.app.state.contacts.contacts
        // Loop over platform endpoint data and match them with
        // existing contact state.
        for (let endpoint of voipaccounts) {
            let endpointMatch = null
            for (const id of Object.keys(contacts)) {
                if (contacts[id].endpoints[endpoint.account_id]) {
                    endpointMatch = {contact: contacts[id], endpoint}
                }
            }

            if (endpointMatch) {
                if (!this.contacts[endpointMatch.contact.id]) {
                    // The contact already exists in state but not as
                    // a logical Contact class. Hydrate one.
                    this.contacts[endpointMatch.contact.id] = new Contact(this.app, endpointMatch.contact)
                }
            } else {
                // The contact endpoint doesn't exist yet. Create a new Contact with
                // this endpoint as it's only endpoint. Use the name of the
                // endpoint for the default Contact name.
                let contact = new Contact(this.app, {
                    endpoints: {
                        [endpoint.account_id]: {
                            active: endpoint.sipreginfo ? true : false,
                            id: endpoint.account_id,
                            name: endpoint.description,
                            number: endpoint.internal_number,
                            status: endpoint.sipreginfo ? 'unavailable' : 'unregistered',
                            ua: endpoint.sipreginfo ? endpoint.sipreginfo.useragent : this.app.$t('Not available'),
                        },
                    },
                    name: endpoint.description,
                })

                this.contacts[contact.id] = contact
            }
        }

        // Persist the updated contact list.
        this.app.setState({contacts: {contacts: this.app.state.contacts.contacts}}, {persist: true})
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
