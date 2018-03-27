/**
* @module ModuleContacts
*/
const Contact = require('./index')
const PresenceSip = require('./presence/sip')


/**
* A SIP contact. This should actually be an endpoint.
*/
class ContactSip extends Contact {
    constructor(...args) {
        super(...args)

        if (this.registered) this.presence = new PresenceSip(this, this.app.modules.calls)
    }
}

module.exports = ContactSip
