'use strict'


/**
 * The SIP class takes care of all SIP communication in the background.
 * Currently this is used to check the presence of contacts.
 */
class Sip {

    /**
     * @param {ClickToDialApp} app - The application object.
     */
    constructor(app) {
        this.app = app
        this.app.logger.debug(`${this} init`)
        this.lib = SIPml
        // Set the verbosity of the Sip library. Useful when you need to
        // debug SIP messages. Supported values are: info, warn, error and fatal.
        this.lib.setDebugLevel('error')

        // Start the stack after stop or right away.
        if (this.sipStack) {
            this.reconnect = true
            this.stop()
        }
    }


    eventsListener(e) {
        let lastEvent
        let retry
        let retryTimeoutDefault = {interval: 2500, limit: 9000000}

        if ([tsip_event_code_e.STACK_FAILED_TO_STOP, tsip_event_code_e.STACK_STOPPED].indexOf(e.o_event.i_code) < 0) {
            lastEvent = e
        }

        this.i_code = e.o_event.i_code
        this.status = e.type

        switch (this.i_code) {
        case tsip_event_code_e.STACK_STARTING:
            if (typeof this.callbacks.starting === 'function') {
                this.callbacks.starting()
            }
            break
        case tsip_event_code_e.STACK_FAILED_TO_START:
            if (typeof this.callbacks.failed_to_start === 'function') {
                this.callbacks.failed_to_start()
            }

            if (this.reconnect) {
                this.sipStack = undefined
                if (!retry) retry = Object.assign({}, retryTimeoutDefault)
                retry = this.app.timer.increaseTimeout(retry)
                this.app.logger.info(`${this} setting reconnect timeout to ${retry.timeout} ms`)
                this.app.timer.setTimeout('contacts.reconnect', retry.timeout)
                this.app.timer.startTimer('contacts.reconnect')
            } else {
                this.app.timer.stopTimer('contacts.reconnect')
            }
            break
        case tsip_event_code_e.STACK_STARTED:
            if (typeof this.callbacks.started === 'function') {
                this.callbacks.started()
            }

            this.app.timer.stopTimer('contacts.reconnect')
            retry = this.app.timer.increaseTimeout(Object.assign({}, retryTimeoutDefault))
            this.app.logger.info(`${this} resetted retry timer to ${retry.timeout} ms`)
            this.app.timer.setTimeout('contacts.reconnect', retry.timeout)
            break
        case tsip_event_code_e.STACK_STOPPED:
            if (lastEvent) {
                if (lastEvent.o_event.o_stack.network.o_transport.stop) {
                    lastEvent.o_event.o_stack.network.o_transport.stop()
                }
                lastEvent = undefined
            }

            if (typeof this.callbacks.stopped === 'function') {
                this.callbacks.stopped()
            }

            if (this.reconnect) {
                this.sipStack = undefined
                this.app.timer.startTimer('contacts.reconnect')
            } else {
                this.app.timer.stopTimer('contacts.reconnect')
            }
            break
        }
    }


    /**
     * Perform a refresh for given account ids.
     * If reload is true it also re issues (un)subscribe events to the
     * websocket server.
     */
    refresh(account_ids, reload) {
        this.app.logger.debug(`${this} refresh`)
        let widgetsData = this.app.store.get('widgets')
        widgetsData.contacts.status = undefined
        this.app.store.set('widgets', widgetsData)
        if (reload) {
            this.app.timer.startTimer('contacts.reconnect')
            // unsubscribe for lost contacts
            if (this.states) {
                $.each(this.states, (index, state) => {
                    if (account_ids.indexOf(state.account_id) < 0) {
                        this.unsubscribe(state.account_id)
                    }
                })
            }

            // Subscribe for new contacts.
            account_ids.forEach((account_id) => {
                let doSubscribe = false
                $.each(this.states, (index, state) => {
                    if (account_id === state.account_id) {
                        doSubscribe = true
                    }
                })
                if (doSubscribe) {
                    this.subscribe(account_id)
                }
            })
        } else {
            // Broadcast presence state for known accounts.
            if (this.states && this.i_code === tsip_event_code_e.STACK_STARTED) {
                $.each(this.states, (index, state) => {
                    this.app.emit('contacts.sip', {
                        account_id: state.account_id,
                        state: state.state,
                    })
                })
            }
        }
    }


    /**
     * Init and start a new stack.
     */
    startStack(callbacks) {
        this.app.logger.debug(`${this} startStack`)
        this.callbacks = callbacks
        let userAgent = `WebSIP v${this.app.version()} w/ sipML5 v${this.version()}`
        if (!('update_url' in this.app.browser.runtime.getManifest())) {
            userAgent += ' (dev=true)'
        }
        let user = this.app.store.get('user')

        // Create sipStack.
        this.sipStack = new SIPml.Stack({
            realm: this.app.settings.realm, // mandatory: domain name
            impi: user.email, // mandatory: authorization name (IMS Private Identity)
            impu: `sip:${user.email}@${this.app.settings.realm}`, // mandatory: valid SIP Uri (IMS Public Identity)
            password: user.token, // optional
            display_name: '', // optional
            websocket_proxy_url: `wss://${this.app.settings.realm}`, // optional
            // outbound_proxy_url: 'udp://example.org:5060', // optional
            enable_rtcweb_breaker: false,
            events_listener: { events: '*', listener: this.eventsListener.bind(this)}, // optional: '*' means all events
            // Optional.
            sip_headers: [
                { name: 'User-Agent', value: userAgent},
                { name: 'Organization', value: 'VoIPGRID'},
            ],
        })
        this.start()
    }

    /**
     * Graceful start, reconnect automatically when necessary.
     */
    start() {
        this.app.logger.info(`${this} start`)
        this.reconnect = true
        if (
            (!this.i_code || this.i_code !== tsip_event_code_e.STACK_STARTED || this.i_code !== tsip_event_code_e.STACK_STARTING) &&
            this.sipStack && this.sipStack.o_stack.e_state !== tsip_transport_state_e.STARTED
        ) {
            this.subscriptions = {}
            this.states = {}
            this.sipStack.start()
        } else {
            this.app.logger.info(`${this} start skipped because status is ${this.status}`)
        }
    }


    /**
     * Graceful stop, do not reconnect automatically.
     */
    stop() {
        this.app.logger.debug(`${this} stop`)
        this.reconnect = false
        // Unsubscribe from all.
        if (this.subscriptions) {
            $.each(this.subscriptions, (from) => {
                this.unsubscribe(from)
            })
        }
        if (this.sipStack) {
            this.sipStack.stop()
        }
        this.subscriptions = {}
        this.states = {}
    }


    subscribe(to) {
        this.app.logger.debug(`${this} subscribe`)
        if (this.subscriptions && this.sipStack) {
            if (this.sipStack.o_stack.e_state !== tsip_transport_state_e.STARTED) {
                this.start()
            }

            if (this.subscriptions.hasOwnProperty(to)) {
                this.app.logger.info('Sip: skip subscribe')
            } else {
                let subscribeSession
                // Keep reference to prevent subscribing multiple times.
                this.subscriptions[to] = subscribeSession

                let presenceSubscriber = (e) => {
                    if (e.o_event.i_code === tsip_event_code_e.DIALOG_TERMINATED) {
                        // Communication terminated, assume this is unwanted!
                        if (this.sipStack) {
                            // Send 'official' stop signal to the stack's signal event listener.
                            this.sipStack.stop()
                        }
                    } else if (e.getContentType() === 'application/dialog-info+xml') {
                        // this.app.logger.info(`session event =  ${e.type}`)
                        if (window.DOMParser) {
                            let parser = new DOMParser()
                            let xmlDoc = parser ? parser.parseFromString(e.getContentString(), 'text/xml') : null
                            let dialogNode = xmlDoc ? xmlDoc.getElementsByTagName('dialog-info')[0] : null
                            if (dialogNode) {
                                let entityUri = dialogNode.getAttribute('entity')
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

                                // Broadcast presence for account.
                                this.app.emit('contacts.sip', {
                                    'account_id': to,
                                    'state': state,
                                })
                                // Remember subscribed accounts and its state at the time of an update.
                                this.states[entityUri] = {
                                    account_id: to,
                                    state: state,
                                }
                            }
                        }
                    }
                }

                let subscribePresence = (_to) => {
                    subscribeSession = this.sipStack.newSession('subscribe', {
                        expires: 3600,
                        events_listener: { events: '*', listener: presenceSubscriber},
                        sip_headers: [
                            // Only notify for 'dialog' events.
                            {name: 'Event', value: 'dialog'},
                            // Subscribe to dialog-info.
                            {name: 'Accept', value: 'application/dialog-info+xml'},
                        ],
                        sip_caps: [
                            {name: '+g.oma.sip-im', value: null},
                            {name: '+audio', value: null },
                            {name: 'language', value: '\"en\"'},
                        ],
                    })

                    // Start watching for entity's presence status
                    // (You may track event type 'connected' to be sure that
                    // the request has been accepted by the server)
                    subscribeSession.subscribe(_to)
                    // Update reference to enable unsubscribe.
                    this.subscriptions[_to] = subscribeSession
                }

                subscribePresence(to)
            }
        }
    }


    unsubscribe(from) {
        this.app.logger.debug(`${this} unsubscribe`)
        if (this.subscriptions.hasOwnProperty(from)) {
            if (this.sipStack && this.sipStack.o_stack.e_state === tsip_transport_state_e.STARTED) {
                this.subscriptions[from].unsubscribe()
            }
            delete this.subscriptions[from]
            delete this.states[from]
        }
    }


    /**
     * Parse the version of SIPml from the path it is included.
     */
    version() {
        // assume the directory name is "simpl5-{VERSION}"
        let pathPrefix = 'sipml5-'
        let version
        this.app.browser.runtime.getManifest().background.scripts.forEach((file) => {
            if (file.indexOf('SIPml') > 0) {
                version = file.substring(file.indexOf(pathPrefix), file.substring(file.indexOf(pathPrefix)).indexOf('/') + file.indexOf(pathPrefix)).substring(pathPrefix.length)
                return;
            }
        })
        return version
    }


    toString() {
        return `${this.app} [Sip]               `
    }
}

module.exports = Sip
