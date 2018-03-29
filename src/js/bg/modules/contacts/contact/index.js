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
    * @param {Object} state - The initial properties of a Contact.
    */
    constructor(app, state) {
        this.app = app
        this._trackState = false

        if (state.sipreginfo) this.registered = true

        this.state = {
            id: state.account_id,
            name: state.callerid_name,
            number: state.internal_number,
            status: state.sipreginfo ? 'unavailable' : 'unregistered',
            userAgent: state.sipreginfo ? state.sipreginfo.useragent : this.app.$t('Not available'),
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

        if (this._trackState) {
            this.app.emit('fg:set_state', {action: 'merge', path: `contacts/contacts/${this.state.id}`, state: state})
        } else if (this.state.id) {
            Vue.set(this.app.state.contacts.contacts, this.state.id, this.state)
            // Send a complete state representation down the wire once.
            this.app.emit('fg:set_state', {action: 'insert', path: `contacts/contacts/${this.state.id}`, state: this.state})
            this._trackState = true
        }
    }
}

module.exports = Contact
