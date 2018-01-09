const SIP = require('sip.js')
// Wait x miliseconds before resolving the subscribe event,
// to prevent the server from being hammered.
const SUBSCRIBE_DELAY = 150


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

        // This flag indicates whether a reconnection attempt will be
        // made when the websocket connection is gone.
        this.reconnect = true

        this.states = {}
        this.subscriptions = {}

        // The default connection timeout to start with.
        this.retryDefault = {interval: 2500, limit: 9000000}
        // Used to store retry state.
        this.retry = Object.assign({}, this.retryDefault)

        this.connect()
        // Append the elements in the background DOM.
        $('body').append('<video class="local"></video><video class="remote"></video>')
        this.localVideoElement = $('.local').get(0)
        this.remoteVideoElement = $('.remote').get(0)

        // The permission should be granted from a foreground script.
        navigator.mediaDevices.getUserMedia({audio: true}).then((stream) => {
            this.stream = stream
        }).catch((err) => {
            this.app.logger.warn(`${this}${err}`)
        })
    }


    /**
    * Init and start a new stack, connecting
    * SipML5 to the websocket SIP backend.
    */
    connect() {
        // Emit to the frontend that the sip client is not yet
        // ready to start.
        if (this.ua && this.ua.isConnected()) {
            this.app.logger.warn(`${this}sip backend already starting or started`)
            return
        }

        this.app.logger.info(`${this}SIP stack starting`)
        this.app.emit('sip:starting', {}, 'both')
        // For webrtc this is a voipaccount, otherwise an email address.
        let {username, password} = this.app.state.settings.webrtc
        if (!(username && password)) {
            return
            // Fallback to email registration.
        }

        this.ua = new SIP.UA({
            authorizationUser: username,
            log: {
                builtinEnabled: false,
                debug: 'error',
            },
            password: password,
            register: true,
            traceSip: true,
            uri: `sip:${username}@voipgrid.nl`,
            userAgentString: process.env.PLUGIN_NAME,
            wsServers: [`wss://${this.app.state.settings.sipEndpoint}`],
        })

        // An incoming call. Set the session object and set state to call.
        this.ua.on('invite', (session) => {
            this.app.logger.debug(`${this}invite coming in`)
            this.session = session
            this.session.accept({
                sessionDescriptionHandlerOptions: {
                    constraints: {
                        audio: true,
                        video: false,
                    },
                },
            })

            this.localVideoElement.srcObject = this.stream
            this.localVideoElement.play()

            this.pc = this.session.sessionDescriptionHandler.peerConnection
            this.remoteStream = new MediaStream()

            this.pc.getReceivers().forEach((receiver) => {
                this.remoteStream.addTrack(receiver.track)
                this.remoteVideoElement.srcObject = this.remoteStream
                this.remoteVideoElement.play()
            })

            // Reset call state when the other halve hangs up.
            this.session.on('bye', (request) => {
                this.localVideoElement.srcObject = null
                this.app.emit('dialer:status.stop', {})
                this.app.logger.notification(this.app.i18n.translate('clicktodialStatusDisconnected'), 'Vialer', false, 'warning')
            })
        })

        this.ua.on('registered', () => {
            this.app.logger.info(`${this}SIP stack registered`)
        })

        this.ua.on('unregistered', () => {
            this.app.logger.info(`${this}SIP stack unregistered`)
        })

        this.ua.on('connected', () => {
            this.app.logger.info(`${this}SIP stack started`)
            // Reset the connection retry timer.
            this.app.emit('sip:started', {}, 'both')
            this.updatePresence()
        })


        this.ua.on('disconnected', () => {
            this.app.logger.info(`${this}SIP stack stopped`)
            this.app.emit('sip:stopped', {}, 'both')

            if (this.reconnect) {
                this.app.logger.info(`${this}SIP stack reconnecting`)
                this.ua.start()
            }
        })
    }


    createSession(phoneNumber) {
        let sessionUrl = `sip:${phoneNumber}@${this.app.state.settings.sipEndpoint}`
        this.app.logger.info(`${this}Starting new session: ${sessionUrl}`)

        //this.session = this.ua.invite(sessionUrl)
        this.session = this.ua.invite(
            sessionUrl, {
                sessionDescriptionHandlerOptions: {
                    constraints: {
                        audio: true,
                        video: false,
                    },
                },
            }
        )

        this.session.on('accepted', (data) => {
            this.localVideoElement.srcObject = this.stream
            this.localVideoElement.play()

            this.pc = this.session.sessionDescriptionHandler.peerConnection
            this.remoteStream = new MediaStream()

            this.pc.getReceivers().forEach((receiver) => {
                this.remoteStream.addTrack(receiver.track)
                this.remoteVideoElement.srcObject = this.remoteStream
                this.remoteVideoElement.play()
            })
        })

        // Reset call state when the other halve hangs up.
        this.session.on('bye', (request) => {
            app.sip.localVideoElement.srcObject = null
            this.app.emit('dialer:status.stop', {})
            this.app.logger.notification(this.app.i18n.translate('clicktodialStatusDisconnected'), 'Vialer', false, 'warning')
        })

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
        if (this.ua && this.ua.isConnected()) {
            this.ua.stop()
            this.app.logger.debug(`${this}disconnected`)
        } else {
            this.app.logger.debug(`${this}not connection to stop`)
        }
    }


    /**
    * Parse an incoming dialog XML request body and return
    * the account state from it.
    * @param {Request} notification - A SIP.js Request object.
    * @returns {String} - The state of the account.
    */
    parseStateFromDialog(notification) {
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


    /**
    * Does the actual subscription to the SIP server.
    * @param {Number} accountId - Account Id of VoIP-account to subscribe to.
    * @returns {Promise} - Resolved when the subscription is ready.
    */
    subscribePresence(accountId) {
        return new Promise((resolve, reject) => {
            this.app.logger.debug(`${this}subscribing to dialog for ${accountId}`)
            this.subscriptions[accountId] = this.ua.subscribe(`${accountId}@voipgrid.nl`, 'dialog')
            this.subscriptions[accountId].on('notify', (notification) => {
                const state = this.parseStateFromDialog(notification)
                // Broadcast presence for account.
                this.app.emit('sip:presence.update', {
                    account_id: accountId,
                    state: state,
                })
                // Remember subscribed accounts and its state at the time
                // of an update.
                this.states[accountId] = {
                    state: state,
                }

                setTimeout(() => {
                    resolve({
                        state: state,
                    })
                }, SUBSCRIBE_DELAY)
            })
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
        if (!this.ua.isConnected()) {
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
