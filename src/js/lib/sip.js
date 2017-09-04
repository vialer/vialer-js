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

        this.reconnect = true
        this.states = {}
        this.subscriptions = {}
        // Emit to the frontend that the sip client is not yet
        // ready to start.
        this.app.emit('sip:before_start', {})
    }


    /**
     * Connect SipML5 to the websocket SIP backend.
     */
    connect() {
        this.app.logger.debug(`${this}connecting to sip backend`)
        if (this._sip) {
            this._sip.start()
        } else {
            this.initStack()
        }
    }


    /**
    * Graceful stop, do not reconnect automatically.
    */
    disconnect() {
        this.reconnect = false
        this.states = {}
        this.subscriptions = {}

        // Unsubscribe from all.
        if (this.subscriptions) {
            $.each(this.subscriptions, (accountId) => {
                this.unsubscribePresence(accountId)
            })
        }
        if (this._sip) {
            // A succesful disconnect returns 0.
            if (this._sip.stop(0) === 0) {
                this.app.logger.debug(`${this}disconnect`)
            }
        } else {
            this.app.logger.debug(`${this}not (yet) connected`)
        }
    }


    /**
    * Init and start a new stack.
    */
    initStack() {
        this.app.logger.debug(`${this}init SIP stack`)
        this.stopped = false
        // The sip stack was already initialized. Just reconnect.
        if (this._sip) {
            this.app.logger.warn(`${this}SIP stack is already active`)
            return
        }

        SIPml.init((e) => {
            this.app.logger.debug(`${this}starting SIP stack`)
            let userAgent = `Click-to-dial v${this.app.version()}`
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
                    { name: 'User-Agent', value: userAgent},
                    { name: 'Organization', value: 'VoIPGRID'},
                ],
                websocket_proxy_url: `wss://${this.app.settings.realm}`,
            })
            this._sip.start()
        }, (event) => {
            this.app.logger.error(`${this}failed to initialize the engine: ${event.message}`)
        })
    }


    /**
    * The SIP stack fires a new event, which is handled by this function.
    * @param {Event} e - Catch-all event when SipML UA tries to connect to
    * the websocket proxy.
    */
    sipStatusEvent(e) {
        let retryTimeoutDefault = {interval: 2500, limit: 9000000}
        this.status = e.type

        switch (e.o_event.i_code) {
        case tsip_event_code_e.STACK_STARTING:
            this.app.emit('sip:starting', {}, 'both')
            break
        case tsip_event_code_e.STACK_FAILED_TO_START:
            this.app.emit('sip:failed_to_start', {}, 'both')
            if (this.reconnect) {
                if (!this.retry) this.retry = Object.assign({}, retryTimeoutDefault)
                setTimeout(this.connect.bind(this), this.retry.interval)
                this.retry = this.app.timer.increaseTimeout(this.retry)
            }
            break
        case tsip_event_code_e.STACK_STARTED:
            // Reset the retry timer.
            this.retry = Object.assign({}, retryTimeoutDefault)
            this.app.emit('sip:started', {}, 'both')
            break
        case tsip_event_code_e.STACK_STOPPED:
            // This event is triggered twice somehow. Flag is resetted when
            // connected again.
            if (this.stopped) {
                // Emitted within the context of the bg script.
                this.app.emit('sip:stopped', {}, 'both')
            }
            this.stopped = true
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
        if (this.status === 'stopped') return false

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
        this.app.logger.debug(`${this} unsubscribe`)
        if (this.subscriptions.hasOwnProperty(accountId)) {
            if (this._sip && this._sip.o_stack.e_state === tsip_transport_state_e.STARTED) {
                this.subscriptions[accountId].unsubscribe()
            }
            delete this.subscriptions[accountId]
            delete this.states[accountId]
        }
    }


    /**
    * Retrieve presence information for given account ids.
    * The presence information is cached. When `update` is used, it
    * will retrieve missing presence information from the sip server.
    * @param {Array} accountIds - The accountIds to update presence for.
    * @param {Boolean} reload - Reload presence from SIP server when true.
    */
    async updatePresence(accountIds, reload) {
        this.app.emit('sip:presences.start_update')
        if (!reload) {
            if (!this._sip) {
                this.app.logger.debug(`${this}not updating from sip server; no sipstack available`)
                return
            }
            this.app.logger.debug(`${this}updating sip subscription for ${accountIds.length} account id's`)

            // Unsubscribe lost contacts that are in cache, but not in
            // the accountIds refresh array.
            const cachedAccountIds = Object.keys(this.states).filter((k, v) => accountIds.includes(k))
            for (let accountId of cachedAccountIds) {
                this.unsubscribePresence(accountId)
            }

            const accountIdsWithoutState = accountIds.filter((accountId) => !(accountId in this.states))
            // Don't do this in parallel, to keep the load on the websocket
            // server low. Also subscribePresence has a fixed timeout before
            // it resolves the connected state, to further slow down the
            // presence requests.
            for (const accountId of accountIdsWithoutState) {
                await this.subscribePresence(accountId)
            }
        } else {
            this.states = {}
            for (const accountId of accountIds) {
                await this.subscribePresence(accountId)
            }
        }

        // Update presence item state in the UI.
        for (let accountId of accountIds) {
            this.app.emit('sip:presence.update', {
                account_id: accountId,
                state: this.states[accountId].state,
            })
        }

        // Clear loading indicator in the ui.
        this.app.emit('sip:presences.updated')
    }
}

module.exports = Sip
