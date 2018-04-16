/**
* @module ModuleContacts
*/

/**
* An Endpoint is a medium that a Contact has to be contacted with.
* A Contact can have multiple Endpoints. This is the base for
* transport-specific implementations (like SIP). The endpoint is
* also responsible for dealing with presence information.
*
*/
class Endpoint {
    /**
    * @param {AppBackground} contact - The Contact instance.
    * @param {Object} state - The initial properties of a Contact.
    */
    constructor(contact, state) {
        this.app = contact.app
        this.contact = contact
        this.id = state.id

        this.state = {
            active: state.active,
            id: state.id,
            name: state.name,
            number: state.number,
            status: state.status,
            ua: state.ua,
        }

        this.setState(this.state)
    }


    /**
    * Keep the state local to this class, unless the
    * call's id is known. Then we can keep track
    * of the call from Vue.
    * @param {Object} state - The state to update.
    */
    setState(state) {
        // This merges to the call's local state; not the app's state!
        this.app.__mergeDeep(this.state, state)

        if (this.state.id) {
            Vue.set(this.app.state.contacts.contacts[this.contact.id].endpoints, this.id, this.state)
            // Send a complete state representation down the wire once.
            this.app.emit('fg:set_state', {action: 'upsert', path: `contacts.contacts.${this.contact.id}.endpoints.${this.id}`, state: this.state})
            this._trackState = true
        }
    }
}

module.exports = Endpoint
