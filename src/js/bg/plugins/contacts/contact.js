const EndpointSip = require('./endpoint/sip')

/**
* @module ModuleContacts
*/

/**
* The Contact base class is used to do the bookkeeping
* for setting Contact-related state.
*/
class Contact {
    /**
    * @param {AppBackground} app - The background application.
    * @param {String} state - The contact's initial state.
    */
    constructor(app, {endpoints = [], favorite = false, id = shortid.generate(), name = 'unnamed'}) {
        this.app = app
        this.id = id

        this.endpoints = {}
        this.state = {endpoints, favorite, id, name}
        Vue.set(this.app.state.contacts.contacts, this.id, this.state)
        this.setState(this.state)

        for (const endpointId of Object.keys(this.state.endpoints)) {
            const endpoint = new EndpointSip(this, this.state.endpoints[endpointId])
            this.endpoints[endpointId] = endpoint
        }
    }


    /**
    * Keep the state local to this class.
    * @param {Object} state - The state to update.
    */
    setState(state) {
        // This merges to the contact's local state; not the app's state!
        this.app.__mergeDeep(this.state, state)
        this.app.emit('fg:set_state', {
            action: 'upsert',
            path: `contacts.contacts.${this.id}`,
            state: this.state,
        })
    }


    unsubscribeEndpoints() {
        for (const id of Object.keys(this.endpoints)) {
            if (this.endpoints[id].presence) {
                this.endpoints[id].presence.unsubscribe()
            }
        }
    }
}

module.exports = Contact
