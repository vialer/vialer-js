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
const Plugin = require('vialer-js/lib/plugin')


/**
* Main entrypoint for Contacts.
* @memberof AppBackground.plugins
*/
class PluginContacts extends Plugin {
    /**
    * @param {AppBackground} app - The background application.
    * @param {Array} providers - ContactProvider classes used to sync Contacts with.
    */
    constructor(app, providers) {
        super(app)

        // Holds Contact instances, not Contact state.
        this.contacts = {}
        this.providers = []

        for (const Provider of providers) {
            this.providers.push(new Provider(this))
        }

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
                online: true, // Hide contacts that don't have registered endpoints.
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
        for (const provider of this.providers) {
            await provider._platformData()
        }
    }


    /**
    * State that is bound to a Class is more complicated to
    * restore when Vue & Vue-stash are already initialized.
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


    _watchers() {
        return {
            'store.settings.wizard.completed': (completed) => {
                if (completed) this.subscribe()
            },
        }
    }


    /**
    * Subscribe here, so we are able to wait before a subscription
    * is completed until going to the next. This prevents the platform
    * server from being hammered.
    */
    async subscribe() {
        const contacts = Object.keys(this.contacts)
        this.app.logger.info(`${this}<platform> presence updates from ${contacts.length} contacts`)
        for (let contactId of contacts) {
            const contact = this.contacts[contactId]
            if (contact && ['registered', 'connected'].includes(this.app.state.calls.ua.status)) {
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
    * Generate a representational name for this module. Used for logging.
    * @returns {String} - An identifier for this module.
    */
    toString() {
        return `${this.app}[contacts] `
    }
}

module.exports = PluginContacts
