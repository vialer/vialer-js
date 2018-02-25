const Presence = require('./index')
const SUBSCRIBE_DELAY = 150

class PresenceSip extends Presence {

    constructor(contact, calls) {
        super(contact, calls)
        this.subscription = null
    }


    /**
    * Subscribe to the SIP server. Use a subscription delay
    * to prevent the server from being hammered.
    * @returns {Promise} - Resolves when ready.
    */
    subscribe() {
        return new Promise((resolve, reject) => {
            this.subscription = this.calls.ua.subscribe(`${this.contact.state.id}@voipgrid.nl`, 'dialog')
            this.subscription.on('notify', (notification) => {
                const state = this.stateFromDialog(notification)
                this.contact.setState({state: state})
                setTimeout(() => {
                    resolve({
                        state: state,
                    })
                }, SUBSCRIBE_DELAY)
            })
        })
    }


    /**
    * Stop listening for subscriber events from the SIP server and remove
    * the cached subscriber state.
    * @param {Number} accountId - The accountId to deregister.
    */
    unsubscribe() {
        if (this.subscription) this.subscription.unsubscribe()
        this.subscription = null
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
}

module.exports = PresenceSip
