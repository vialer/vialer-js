/**
* @module ModuleContacts
*/

/**
* Base class for keeping track of Presence information.
*/
class Presence {
    constructor(endpoint) {
        this.app = endpoint.app
        this.endpoint = endpoint
    }
}

module.exports = Presence
