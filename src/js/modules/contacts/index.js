'use strict'

const ContactsActions = require('./actions')


/**
 * The Contacts widget.
 */
class ContactsModule {
    /**
     * @param {ClickToDialApp} app - The application object.
     */
    constructor(app) {
        this.app = app
        this.app.modules.contacts = this
        this.actions = new ContactsActions(app)

        if (this.app.env.extension.background) {
            this._background()
        }
    }


    /**
     * Register local events; e.g. events that are triggered from the background
     * and handled by the background.
     */
    _background() {
        this.app.logger.info(`${this}listen for sip events`)

        this.app.on('sip:starting', (e) => {
            let widgetsData = this.app.store.get('widgets')
            widgetsData.contacts.status = 'connecting'
            this.app.store.set('widgets', widgetsData)
            this.app.emit('contacts.connecting')
        })

        this.app.on('sip:started', (e) => {
            let widgetsData = this.app.store.get('widgets')
            widgetsData.contacts.status = 'connected'
            this.app.store.set('widgets', widgetsData)
            let accountIds = widgetsData.contacts.list.map((c) => c.account_id)
            this.app.sip.updatePresence(accountIds, true)
        })

        this.app.on('sip:failed_to_start', (e) => {
            let widgetsData = this.app.store.get('widgets')
            widgetsData.contacts.status = 'failed_to_start'
            this.app.store.set('widgets', widgetsData)
            this.app.emit('contacts.failed_to_start')
        })

        this.app.on('sip:stopped', (e) => {
            let widgetsData = this.app.store.get('widgets')
            if (widgetsData) {
                widgetsData.contacts.status = 'disconnected'
                this.app.store.set('widgets', widgetsData)
            }
            this.app.emit('contacts.disconnected')
        })

    }


    /**
     * Module load function inits some stuff. The update property is true when
     * refreshing the plugin.
     */
    _load(update) {
        if (!this.app.env.extension.background) return

        this.app.api.client.get('api/phoneaccount/basic/phoneaccount/?active=true&order_by=description')
        .then((res) => {
            this.app.emit('widget.indicator.stop', {name: 'contacts'})

            if (this.app.api.OK_STATUS.includes(res.status)) {
                let contacts = res.data.objects
                this.app.logger.debug(`${this}updating contacts list(${contacts.length})`)

                // Remove accounts that are not currently registered.
                for (let i = contacts.length - 1; i >= 0; i--) {
                    if (!contacts[i].hasOwnProperty('sipreginfo')) {
                        contacts.splice(i, 1)
                    }
                }

                let widgetsData = this.app.store.get('widgets')
                if (widgetsData) {
                    widgetsData.contacts.list = contacts
                    widgetsData.contacts.unauthorized = false
                    widgetsData.contacts.status = 'connecting'
                    this.app.store.set('widgets', widgetsData)

                    this.app.emit('contacts.connecting')

                    if (contacts.length) {
                        this.app.emit('contacts.reset')
                        this.app.emit('contacts.fill', {
                            contacts: contacts,
                            callback: () => {
                                if (update) {
                                    this.updateSubscriptions(true)
                                } else {
                                    this.app.sip.initStack()
                                }
                            },
                        })
                    } else {
                        this.app.emit('contacts.empty')
                    }
                }
            } else if (this.app.api.NOTOK_STATUS.includes(res.status)) {
                this.app.sip.disconnect()

                if (this.app.api.UNAUTHORIZED_STATUS.includes(res.status)) {
                    this.app.logger.info(`${this}unauthorized contacts`)
                    // Update authorization status.
                    let widgetsData = this.app.store.get('widgets')
                    widgetsData.contacts.unauthorized = true
                    this.app.store.set('widgets', widgetsData)

                    // Display an icon explaining the user lacks permissions to use
                    // this feature of the plugin.
                    this.app.emit('widget.unauthorized', {name: 'contacts'})
                    this.app.sip.disconnect()
                }

            }
        })
    }


    _reset() {
        this.app.logger.info(`${this}reset`)
        this.app.emit('contacts.reset')
        this.app.emit('contacts.empty')

        // Stop reconnection attempts.
        this.app.sip.disconnect()
    }


    _restore() {
        this.app.logger.info(`${this}reloading widget contacts`)
        // Check if unauthorized.
        let widgetsData = this.app.store.get('widgets')
        if (widgetsData.contacts.unauthorized) {
            this.app.logger.debug(`${this}unauthorized to restore`)
            this.app.emit('widget.unauthorized', {name: 'contacts'})
        } else {
            this.app.logger.info(`${this}restoring contacts`)
            // Restore contacts.
            let contacts = widgetsData.contacts.list
            if (contacts && contacts.length) {
                this.app.emit('contacts.reset')
                this.app.emit('contacts.fill', {
                    contacts: contacts,
                    callback: () => {
                        this.updateSubscriptions(false)
                    },
                })
            } else {
                this.app.emit('contacts.empty')
            }
        }

        if (widgetsData.contacts.status) {
            this.app.emit('contacts.' + widgetsData.contacts.status)
        }
    }


    toString() {
        return `${this.app} [Contacts]           `
    }


    updateSubscriptions(reload) {
        this.app.logger.info(`${this}updateSubscriptions with reload: ${reload}`)
        let widgetsData = this.app.store.get('widgets')
        let accountIds = widgetsData.contacts.list.map((c) => c.account_id)
        this.app.sip.updatePresence(accountIds, reload)
    }
}

module.exports = ContactsModule
