/**
* Base class for keeping track of Presence information.
*/
class Presence {
    constructor(contact, calls) {
        this.contact = contact
        this.calls = calls
    }
}

module.exports = Presence
