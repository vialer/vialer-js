// Wait x miliseconds before resolving the subscribe event,
// to prevent the server from being hammered.
const SUBSCRIBE_DELAY = 200


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
        // Set the verbosity of the Sip library. Useful when you need to
        // debug SIP messages. Supported values are: info, warn, error and
        // fatal.
        SIPml.setDebugLevel('error')

        // This flag indicates whether a reconnection attempt will be
        // made when the websocket connection is gone.
        this.reconnect = true

        this.states = {}
        this.subscriptions = {}

        // The default connection timeout to start with.
        this.retryDefault = {interval: 2500, limit: 9000000}
        // Used to store retry state.
        this.retry = Object.assign({}, this.retryDefault)

        // Periodically checks the websocket status.
        this.app.timer.registerTimer('sip.check_connection', () => {
            // A connection attempt without user credentials is useless.
            if (app.hasCredentials()) {
                // The current status is disconnect and we want to reconnect.
                if (this.reconnect && this.status === 'stopped') {
                    this.connect()
                    // Increase the (jittered) timeout before the next connection
                    // attempt is made. The timeout is reset when a connection
                    // was succesfully established (`STACK_STARTED`).
                    // The reason for this is to offload the websocket server
                    // when a lot of clients try to (re)connect at once.
                    this.retry = this.app.timer.increaseTimeout(this.retry)
                    this.app.timer.setTimeout('sip.check_connection', this.retry.timeout)
                }
            }
            this.app.timer.startTimer('sip.check_connection')
        })

        // Set the initial connection check timer.
        this.app.timer.setTimeout('sip.check_connection', this.retryDefault.interval)
        this.app.timer.startTimer('sip.check_connection')

        SIPml.init((e) => {
            // Connect the websocket when credentials are set. Otherwise
            // the connection is made when logging in.
            if (app.hasCredentials()) this.connect()
        }, (e) => {
            this.app.logger.error(`${this}failed to initialize the SIP engine: ${e.message}`)
        })
    }


    /**
    * Init and start a new stack, connecting
    * SipML5 to the websocket SIP backend.
    */
    connect() {
        // Emit to the frontend that the sip client is not yet
        // ready to start.
        if (['started', 'starting'].includes(this.status)) {
            this.app.logger.warn(`${this}sip backend already starting or started`)
            return
        }

        this.app.logger.debug(`${this}connecting to sip backend`)
        this.app.emit('sip:before_start', {})

        let user = this.app.store.get('user')

        this._sip = new SIPml.Stack({
            display_name: '',
            enable_rtcweb_breaker: false,
            events_listener: {
                events: '*',
                listener: this.sipStatusEvent.bind(this),
            },
            impi: user.email, // authorization name (IMS Private Identity)
            impu: `sip:${user.email}@${this.app.settings.realm}`, // valid SIP Uri (IMS Public Identity)
            password: user.token,
            realm: this.app.settings.realm, // domain name
            sip_headers: [
                { name: 'User-Agent', value: `Click-to-dial v${this.app.version()}`},
                { name: 'Organization', value: 'VoIPGRID'},
            ],
            websocket_proxy_url: `wss://${this.app.settings.realm}`,
        })
        this._sip.start()
    }


    /**
    * Graceful stop, do not reconnect automatically.
    * @param {Boolean} reconnect - Whether try to reconnect.
    */
    disconnect(reconnect = true) {
        this.reconnect = reconnect
        this.states = {}
        this.subscriptions = {}

        // Unsubscribe from all.
        if (this.subscriptions) {
            $.each(this.subscriptions, (accountId) => {
                this.unsubscribePresence(accountId)
            })
        }
        if (this._sip && this._sip.stop(0) === 0) {
            // A succesful disconnect returns 0.
            this.app.logger.debug(`${this}disconnect`)
        } else {
            this.app.logger.debug(`${this}not (yet) connected`)
        }
    }


    /**
    * The SIP stack fires a new event, which is handled by this function.
    * @param {Event} e - Catch-all event when SipML UA tries to connect to
    * the websocket proxy.
    */
    sipStatusEvent(e) {
        this.status = e.type
        // Keep the websocket connection status in sync with localstorage.
        this.app.store.set('sip', {status: this.status})

        // SipML5 hack to trigger STACK_STOPPED event logic just once.
        if (e.o_event.i_code !== tsip_event_code_e.STACK_STOPPED) this._stopped = false

        switch (e.o_event.i_code) {
            case tsip_event_code_e.STACK_STARTING:
                this._stopped = false
                this.app.logger.info(`${this}SIP stack starting`)
                this.app.emit('sip:starting', {}, 'both')
                break
            case tsip_event_code_e.STACK_FAILED_TO_START:
                this._stopped = false
                this.app.logger.warn(`${this}SIP stack failed to start`)
                this.app.emit('sip:failed_to_start', {}, 'both')
                break
            case tsip_event_code_e.STACK_STARTED:
                this._stopped = false
                this.app.logger.info(`${this}SIP stack started`)
                // Reset the connection retry timer.
                this.retry = Object.assign({}, this.retryDefault)
                this.app.emit('sip:started', {}, 'both')
                // Start updating presence information.
                this.updatePresence()
                break
            case tsip_event_code_e.STACK_STOPPED:
                // SipML5 hack to trigger STACK_STOPPED event logic just once.
                if (!this._stopped) {
                    this.app.logger.info(`${this}SIP stack stopped`)
                    this.app.emit('sip:stopped', {}, 'both')
                }

                this._stopped = true
                break
        }
    }


    /**
    * Called multiple times for each presence subscription is registered.
    * @param {Event} e - Catch-all event when a subscribe event is triggered.
    * @param {Number} accountId - The accountId of the subscriber.
    * @param {Function} resolve - The Promise resolver function.
    */
    subscribeEvent(e, accountId, resolve) {
        if (e.type === 'connected') {
            setTimeout(() => {
                resolve({
                    accountId: accountId,
                    event: e,
                })
            }, SUBSCRIBE_DELAY)
        } else if (e.type === 'i_notify') {
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
                this.app.emit('sip:presence.update', {
                    account_id: accountId,
                    state: state,
                })
                // Remember subscribed accounts and its state at the time
                // of an update.
                this.states[accountId] = {
                    entityUri: entityUri,
                    state: state,
                }
            }
        }
    }


    /**
    * Does the actual subscription to the SIP server.
    * @param {Number} accountId - Account Id of VoIP-account to subscribe to.
    * @returns {Promise} - Resolved when the subscription is ready.
    */
    subscribePresence(accountId) {
        if (this.status !== 'started') return false

        return new Promise((resolve, reject) => {
            // Keep reference to prevent subscribing multiple times.
            this.subscriptions[accountId] = this._sip.newSession('subscribe', {
                events_listener: {
                    events: '*',
                    listener: (e) => {
                        this.subscribeEvent(e, accountId, resolve)
                    },
                },
                expires: 3600,
                sip_caps: [
                    {name: '+g.oma.sip-im', value: null},
                    {name: '+audio', value: null },
                    {name: 'language', value: '\"en\"'},
                ],
                sip_headers: [
                    // Only notify for 'dialog' events.
                    {name: 'Event', value: 'dialog'},
                    // Subscribe to dialog-info.
                    {name: 'Accept', value: 'application/dialog-info+xml'},
                ],
            })

            // Start watching for entity's presence status. Make
            // sure to pass the accountId as string.
            this.subscriptions[accountId].subscribe(`${accountId}`)
        })
    }


    toString() {
        return `${this.app}[sip] `
    }


    /**
    * Stop listening for subscriber events from the SIP server and remove
    * the cached subscriber state.
    * @param {Number} accountId - The accountId to deregister.
    */
    unsubscribePresence(accountId) {
        this.app.logger.debug(`${this}unsubscribe presence ${accountId}`)
        if (this.subscriptions.hasOwnProperty(accountId)) {
            if (this._sip && this._sip.o_stack.e_state === tsip_transport_state_e.STARTED) {
                this.subscriptions[accountId].unsubscribe()
            }
            delete this.subscriptions[accountId]
            delete this.states[accountId]
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
    async updatePresence(refresh) {
        // The transport must be ready, in order to be able to update
        // presence information from the SIP server.
        if (this.status !== 'started') {
            this.app.logger.warn(`${this}cannot update presence without websocket connection.`)
            return
        }

        // Get the current account ids from localstorage.
        let widgetState = this.app.store.get('widgets')
        // The SIP stack already started, but the contacts were not filled yet.
        if (!widgetState || !widgetState.contacts || !widgetState.contacts.list) return
        let accountIds = widgetState.contacts.list.map((c) => c.account_id)

        if (refresh) {
            // Set all colleagues to unavailable in the UI and
            // clear the states object.
            for (let accountId in this.states) {
                this.app.emit('sip:presence.update', {account_id: accountId, state: 'unavailable'})
            }
            this.states = {}
        } else {
            // Notify the current cached presence to the UI asap.
            for (let accountId in this.states) {
                this.app.emit('sip:presence.update', {
                    account_id: accountId,
                    state: this.states[accountId].state,
                })
            }
        }

        // Always unsubscribe lost contacts that are in cache, but not in
        // the accountIds refresh array.
        const oldCachedAccountIds = Object.keys(this.states).filter((k, v) => !accountIds.includes(Number(k)))

        this.app.logger.debug(`${this}SIP subscription unsubscribe cleanup for ${oldCachedAccountIds.length} accounts`)
        for (let accountId of oldCachedAccountIds) {
            this.unsubscribePresence(Number(accountId))
        }

        const accountIdsWithoutState = accountIds.filter((accountId) => !(accountId in this.states))
        this.app.logger.debug(`${this}SIP subscription update for ${accountIdsWithoutState.length} accounts`)

        if (accountIdsWithoutState.length) {
            this.app.emit('sip:presences.start_update')

            for (const accountId of accountIdsWithoutState) {
                // We could do this in parallel, but we don't to keep the load on
                // the websocket server low. Also subscribePresence has a fixed
                // timeout before it resolves the connected state, to further slow
                // down the presence requests.
                await this.subscribePresence(Number(accountId))
            }

            // Clear loading indicator in the ui.
            this.app.emit('sip:presences.updated')
        }
    }
}

module.exports = Sip
