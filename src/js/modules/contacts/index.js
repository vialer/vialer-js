/**
 * @module Contacts
 */
const ContactsActions = require('./actions')


/**
* The Contacts module.
*/
class ContactsModule {
    /**
    * @param {ClickToDialApp} app - The application object.
    */
    constructor(app) {
        this.app = app
        this.app.modules.contacts = this
        this.actions = new ContactsActions(app)
    }


    toString() {
        return `${this.app}[contacts] `
    }


    /**
    * Functionality to load for this module.
    * @param {Boolean} update - True when refreshing the plugin.
    */
    _load(update) {
        if (this.app.env.extension && !this.app.env.extension.background) return

        this.app.api.client.get('api/phoneaccount/basic/phoneaccount/?active=true&order_by=description').then((res) => {
            this.app.emit('ui:widget.reset', {name: 'contacts'})

            if (this.app.api.OK_STATUS.includes(res.status)) {
                let contacts = res.data.objects
                this.app.logger.debug(`${this}updating contacts list(${contacts.length})`)

                // Remove accounts that are not currently registered.
                for (let i = contacts.length - 1; i >= 0; i--) {
                    if (!contacts[i].hasOwnProperty('sipreginfo')) {
                        contacts.splice(i, 1)
                    }
                }

                let widgetState = this.app.store.get('widgets')
                if (widgetState) {
                    widgetState.contacts.list = contacts
                    widgetState.contacts.unauthorized = false
                    widgetState.contacts.status = 'connecting'
                    this.app.store.set('widgets', widgetState)

                    if (contacts.length) {
                        this.app.emit('contacts:reset')
                        this.app.emit('contacts:fill', {
                            callback: () => {
                                if (update) {
                                    let accountIds = widgetState.contacts.list.map((c) => c.account_id)
                                    this.app.sip.updatePresence(accountIds, true)
                                } else {
                                    // Start the stack once we got all contacts
                                    // from the api.
                                    this.app.sip.connect()
                                }
                            },
                            contacts: contacts,
                        })
                    } else {
                        this.app.emit('contacts:empty')
                    }
                }
            } else if (this.app.api.NOTOK_STATUS.includes(res.status)) {
                this.app.sip.disconnect()

                if (this.app.api.UNAUTHORIZED_STATUS.includes(res.status)) {
                    this.app.logger.info(`${this}unauthorized contacts`)
                    // Update authorization status.
                    let widgetState = this.app.store.get('widgets')
                    widgetState.contacts.unauthorized = true
                    this.app.store.set('widgets', widgetState)

                    // Display an icon explaining the user lacks permissions
                    // to use this feature of the plugin.
                    this.app.emit('ui:widget.unauthorized', {name: 'contacts'})
                    this.app.sip.disconnect()
                }

            }
        })
    }


    _reset() {
        this.app.logger.info(`${this}reset`)
        this.app.emit('contacts:reset')
        this.app.emit('contacts:empty')
        // Stop reconnection attempts.
        this.app.sip.disconnect()
    }


    _restore() {
        // Check if unauthorized.
        let widgetState = this.app.store.get('widgets')
        if (!widgetState) this.app.emit('contacts:empty')
        else if (widgetState.contacts.unauthorized) {
            this.app.logger.debug(`${this}unauthorized to restore`)
            this.app.emit('ui:widget.unauthorized', {name: 'contacts'})
        } else {
            this.app.logger.info(`${this}restoring contacts`)
            // Restore contacts.
            let contacts = widgetState.contacts.list
            if (contacts && contacts.length) {
                this.app.emit('contacts:reset')
                this.app.emit('contacts:fill', {
                    callback: () => {
                        let accountIds = widgetState.contacts.list.map((c) => c.account_id)
                        this.app.sip.updatePresence(accountIds, false)
                    },
                    contacts: contacts,
                })
            } else {
                this.app.emit('contacts:empty')
            }
        }
    }
}

module.exports = ContactsModule
