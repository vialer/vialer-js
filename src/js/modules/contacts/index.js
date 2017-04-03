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
    }


    initializeSIPmlCallback() {
        this.app.logger.info(`${this}initializeSIPmlCallback`)
        this.app.sip.startStack({
            starting: () => {
                let widgetsData = this.app.store.get('widgets')
                widgetsData.contacts.status = 'connecting'
                this.app.store.set('widgets', widgetsData)
                this.app.emit('contacts.connecting')
            },
            failed_to_start: () => {
                let widgetsData = this.app.store.get('widgets')
                widgetsData.contacts.status = 'failed_to_start'
                this.app.store.set('widgets', widgetsData)
                this.app.emit('contacts.failed_to_start')
            },
            started: () => {
                let widgetsData = this.app.store.get('widgets')
                widgetsData.contacts.status = 'connected'
                this.app.store.set('widgets', widgetsData)

                $.each(widgetsData.contacts.list, (n, contact) => {
                    setTimeout(() => {
                        this.app.sip.subscribe('' + contact.account_id)
                    }, n * 200)
                })
                setTimeout(() => {
                    this.app.emit('contacts.connected')
                }, widgetsData.contacts.list.length * 200)
            },
            stopped: () => {
                let widgetsData = this.app.store.get('widgets')
                if (widgetsData) {
                    widgetsData.contacts.status = 'disconnected'
                    this.app.store.set('widgets', widgetsData)
                }

                this.app.emit('contacts.disconnected')
            },
        })
    }


    load(update) {
        if (!this.app.env.extension.background) {
            return
        }
        if (!update) {
            this.app.timer.registerTimer('contacts.reconnect', this.reconnect)
        }
        let phoneaccountUrl = `${this.app.api.getUrl('phoneaccount')}?active=true&order_by=description`
        this.app.api.asyncRequest(phoneaccountUrl, null, 'get', {
            onComplete: () => {
                this.app.emit('widget.indicator.stop', {name: 'contacts'})
            },
            onOk: (response) => {
                let contacts = response.objects

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
                                    this.startSubscriptions()
                                }
                            },
                        })
                    } else {
                        this.app.emit('contacts.empty')
                        // Cancel active subscriptions.
                        // this.app.sip.stop();
                    }
                }
            },
            onNotOk: () => {
                // Stop reconnection attempts.
                this.app.timer.stopTimer('contacts.reconnect')

                // Cancel active subscriptions.
                this.app.sip.stop()
            },
            onUnauthorized: () => {
                this.app.logger.info(`${this}unauthorized contacts`)
                // Update authorization status.
                let widgetsData = this.app.store.get('widgets')
                widgetsData.contacts.unauthorized = true
                this.app.store.set('widgets', widgetsData)

                // Display an icon explaining the user lacks permissions to use
                // this feature of the plugin.
                this.app.emit('widget.unauthorized', {name: 'contacts'})
                // Stop reconnection attempts.
                this.app.timer.stopTimer('contacts.reconnect')
                // Cancel active subscriptions.
                this.app.sip.stop()
            },
        })
    }


    /**
     * Reconnect to presence resource.
     */
    reconnect() {
        if (this.app.timer.getRegisteredTimer('contacts.reconnect')) {
            this.startSubscriptions()
        }
    }


    startSubscriptions() {
        this.app.logger.debug(`${this}startSubscriptions`)
        // Initialize SIPml if necessary.
        if (this.app.sip.lib.isInitialized()) {
            this.initializeSIPmlCallback()
        } else {
            this.app.sip.lib.init(this.initializeSIPmlCallback.bind(this), (event) => {
                this.app.logger.error(`${this}failed to initialize the engine: ${event.message}`)
            })
        }
    }


    reset() {
        this.app.logger.info(`${this}reset`)
        this.app.emit('contacts.reset')
        this.app.emit('contacts.empty')

        // Stop reconnection attempts.
        this.app.timer.stopTimer('contacts.reconnect')
        this.app.timer.unregisterTimer('contacts.reconnect')
        this.app.sip.stop()
    }


    restore() {
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
        this.app.logger.info(`${this}updateSubscriptions`)
        let widgetsData = this.app.store.get('widgets')
        let account_ids = []
        widgetsData.contacts.list.forEach((contact) => {
            account_ids.push('' + contact.account_id)
        })
        this.app.sip.refresh(account_ids, reload)
    }
}

module.exports = ContactsModule
