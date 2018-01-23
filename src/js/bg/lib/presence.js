// Wait x miliseconds before resolving the subscribe event,
// to prevent the server from being hammered.
const SUBSCRIBE_DELAY = 150


class Presence {

    constructor(sip) {
        this.sip = sip
        this.app = sip.app
        this.ua = sip.ua

        this.subscriptions = {}
    }


    /**
    * Does the actual subscription to the SIP server.
    * @param {Number} accountId - Account Id of VoIP-account to subscribe to.
    * @returns {Promise} - Resolved when the subscription is ready.
    */
    async subscribe(accountId) {
        return new Promise((resolve, reject) => {
            this.app.logger.debug(`${this}subscribe ${accountId}@voipgrid.nl dialog`)
            this.subscriptions[accountId] = this.ua.subscribe(`${accountId}@voipgrid.nl`, 'dialog')

            this.subscriptions[accountId].on('notify', (notification) => {
                const state = this.stateFromDialog(notification)
                let contacts = this.app.state.contacts.contacts
                for (let contact of contacts) {
                    if (contact.account_id === accountId) {
                        contact.state = state
                    }
                }

                setTimeout(() => {
                    resolve(state)
                }, SUBSCRIBE_DELAY)
            })
        })
    }


    /**
    * Stop listening for subscriber events from the SIP server and remove
    * the cached subscriber state.
    * @param {Number} accountId - The accountId to deregister.
    */
    unsubscribe(accountId) {
        if (this.ua.isConnected()) {
            this.app.logger.debug(`${this}cannot unsubscribe presence ${accountId} without connection`)
            return
        }
        this.app.logger.debug(`${this}unsubscribe presence ${accountId}`)
        if (this.subscriptions.hasOwnProperty(accountId)) {
            this.subscriptions[accountId].unsubscribe()
            delete this.subscriptions[accountId]
            delete this.states[accountId]
        }
    }


    /**
    * Parse an incoming dialog XML request body and return
    * the account state from it.
    * @param {Request} notification - A SIP.js Request object.
    * @returns {String} - The state of the account.
    */
    stateFromDialog(notification) {
        let parser = new DOMParser()
        let xmlDoc = parser ? parser.parseFromString(notification.request.body, 'text/xml') : null
        let dialogNode = xmlDoc ? xmlDoc.getElementsByTagName('dialog-info')[0] : null
        if (!dialogNode) throw Error('Notification message is missing a dialog node')

        let stateAttr = dialogNode.getAttribute('state')
        // let localNode = dialogNode.getElementsByTagName('local')[0]
        let stateNode = dialogNode.getElementsByTagName('state')[0]
        let state = 'unavailable'

        if (stateAttr === 'full') {
            state = 'available'
        }

        // State node has final say, regardless of stateAttr!
        if (stateNode) {
            switch (stateNode.textContent) {
                case 'trying':
                case 'proceeding':
                case 'early':
                    state = 'ringing'
                    break
                case 'confirmed':
                    state = 'busy'
                    break
                case 'terminated':
                    state = 'available'
                    break
            }
        }
        return state
    }


    unsubscribeAll() {
        // Unsubscribe from all.
        if (this.subscriptions) {
            Object.keys(this.subscriptions).forEach((accountId) => {
                this.unsubscribe(accountId)
            })
        }
    }


    /**
    * Update presence information for given account ids. The presence info
    * is cached and will only subscribe for account ids that are not yet
    * in the cached states object. This behaviour can be overridden using
    * the `refresh` option. With `refresh`, all supplied account ids will
    * have their presence updated from the SIP server.
    * @param {Boolean} refresh - Force refreshing presence from the sip service.
    */
    async update() {
        // The transport must be ready, in order to be able to update
        // presence information from the SIP server.
        if (!this.ua || !this.ua.isConnected()) {
            this.app.logger.warn(`${this}cannot update presence without websocket connection.`)
            return
        }

        let contacts = this.app.state.contacts.contacts

        for (let contact of contacts) {
            contact.state = await this.subscribe(contact.account_id)
        }
    }
}

module.exports = Presence
