/**
* @module ModuleContacts
*/
const Endpoint = require('./index')
const PresenceSip = require('./presence/sip')


/**
* A SIP endpoint which can subscribe to a SIP-server
* for presence information. See PresenceSIP for
* implementation details.
*/
class EndpointSip extends Endpoint {
    /**
    * @param {Contact} contact - The contact that this endpoint is bound to.
    * @param {Object} state - The state to initialize the endpoint with.
    */
    constructor(contact, state) {
        super(contact, state)

        if (this.state.active) {
            this.presence = new PresenceSip(this, this.app.modules.calls)
        }
    }
}

module.exports = EndpointSip
