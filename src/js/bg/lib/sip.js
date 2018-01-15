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
        this.state = this.app.state.sip
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

        this.app.on('sip:accept_session', () => {
            this.acceptSession()
        })

        this.app.on('sip:stop_session', () => {
            if (['create', 'invite'].includes(this.state.session.state)) {
                this.session.reject()
            } else if (['accepted'].includes(this.state.session.state)) {
                this.session.bye()
            } else {
                this.app.logger.warn(`${this}cannot stop sessesion from state '${this.state.session.state}'`)
            }

        })
    }


    acceptSession() {
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
            this.app.setState({session: {state: 'bye'}})
            window.setTimeout(() => {
                this.app.setState({sip: {session: {state: null}}})
            }, 3000)
            this.localVideoElement.srcObject = null
            // this.app.emit('dialer:status.stop', {})
            // this.app.logger.notification(this.app.i18n.translate('clicktodialStatusDisconnected'), 'Vialer', false, 'warning')
        })
    }


    /**
    * Init and start a new stack, connecting
    * SipML5 to the websocket SIP backend.
    */
    connect() {
        this.app.setState({sip: {session: {state: null}}})
        // Emit to the frontend that the sip client is not yet
        // ready to start.
        if (this.ua && this.ua.isConnected()) {
            this.app.logger.warn(`${this}sip backend already starting or started`)
            return
        }
        this.app.setState({contacts: {sip: {state: 'disconnected'}}})

        const settings = this.app.state.settings

        // For webrtc this is a voipaccount, otherwise an email address.
        let uaOptions = {
            log: {
                builtinEnabled: false,
                debug: 'error',
            },
            traceSip: false,
            userAgentString: process.env.PLUGIN_NAME,
            wsServers: [`wss://${settings.sipEndpoint}`],
        }

        // Login with the WebRTC account and register.
        if (settings.webrtc.enabled) {
            uaOptions.authorizationUser = settings.webrtc.username
            uaOptions.password = settings.webrtc.password
            uaOptions.register = true
            uaOptions.uri = `sip:${settings.webrtc.username}@voipgrid.nl`
        } else {
            // Login with platform email without register.
            uaOptions.authorizationUser = this.app.state.user.email
            uaOptions.password = this.app.state.user.password
            uaOptions.register = false
            uaOptions.uri = `sip:${this.app.state.user.email}`
        }

        if (!uaOptions.authorizationUser || !uaOptions.password) {
            this.app.logger.warn(`${this}cannot connect without username and password`)
            return
        }

        this.ua = new SIP.UA(uaOptions)

        // An incoming call. Set the session object and set state to call.
        this.ua.on('invite', (session) => {
            this.app.setState({
                sip: {
                    callerid: session.remoteIdentity.displayName,
                    session: {state: 'invite'},
                },
            })

            this.ringtone = new Audio(`ringtones/${this.app.state.settings.ringtones.selected.name}`)
            this.ringtone.addEventListener('ended', function() {
                this.currentTime = 0
                this.play()
            }, false)
            this.ringtone.play()

            this.session = session

            this.session.on('accepted', () => {
                this.app.setState({sip: {session: {state: 'accepted'}}})
                this.ringtone.pause()
                this.ringtone.currentTime = 0
            })

            this.session.on('rejected', () => {
                this.ringtone.pause()
                this.ringtone.currentTime = 0
                this.app.setState({sip: {session: {state: 'rejected'}}})
                window.setTimeout(() => {
                    this.app.setState({sip: {session: {state: null}}})
                }, 3000)
            })

            this.session.on('bye', () => {
                this.app.setState({
                    sip: {session: {state: 'bye'}},
                })

                window.setTimeout(() => {
                    this.app.setState({sip: {session: {state: null}}})
                }, 3000)
            })

            this.app.logger.debug(`${this}invite coming in`)
        })

        this.ua.on('registered', () => {
            this.app.setState({ua: {state: 'registered'}})
            this.app.logger.info(`${this}SIP stack registered`)
        })

        this.ua.on('unregistered', () => {
            this.app.setState({ua: {state: 'unregistered'}})
            this.app.logger.info(`${this}SIP stack unregistered`)
        })

        this.ua.on('connected', () => {
            this.app.setState({ua: {state: 'connected'}})
            this.app.logger.info(`${this}SIP stack started`)
            this.app.setState({contacts: {sip: {state: 'started'}}})
            this.updatePresence()
        })


        this.ua.on('disconnected', () => {
            this.app.setState({ua: {state: 'disconnected'}})
            this.app.logger.info(`${this}SIP stack stopped`)
            this.app.setState({contacts: {sip: {state: 'disconnected'}}})

            if (this.reconnect) {
                this.app.logger.info(`${this}SIP stack reconnecting`)
                this.ua.start()
            }
        })
    }


    createSession(phonenumber) {
        let sessionUrl = `sip:${phonenumber}@voipgrid.nl`
        this.app.logger.info(`${this}Starting new session: ${sessionUrl}`)
        this.app.setState({
            sip: {
                number: phonenumber,
                session: {state: 'create'},
            },
        })

        this.session = this.ua.invite(
            sessionUrl, {
                sessionDescriptionHandlerOptions: {
                    constraints: {
                        audio: true,
                        video: false,
                    },
                },
            })

        this.session.on('accepted', (data) => {
            this.app.setState({sip: {session: {state: 'accepted'}}})

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
            this.app.setState({session: {state: 'bye'}})
            window.setTimeout(() => {
                this.app.setState({sip: {session: {state: null}}})
            }, 3000)
            this.localVideoElement.srcObject = null
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
            this.app.logger.debug(`${this}subscribe ${accountId}@voipgrid.nl dialog`)
            this.subscriptions[accountId] = this.ua.subscribe(`${accountId}@voipgrid.nl`, 'dialog')
            let contacts = this.app.state.contacts.contacts
            let contactsLookup = new Map(contacts.map((c) => [c.account_id, c]))

            this.subscriptions[accountId].on('notify', (notification) => {
                const state = this.parseStateFromDialog(notification)
                let contact = contactsLookup.get(accountId)
                contact.state = state

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
    async updatePresence() {
        // The transport must be ready, in order to be able to update
        // presence information from the SIP server.
        if (!this.ua || !this.ua.isConnected()) {
            this.app.logger.warn(`${this}cannot update presence without websocket connection.`)
            return
        }

        let accountIds = this.app.state.contacts.contacts.map((c) => c.account_id)
        // Always unsubscribe lost contacts that are in cache, but not in
        // the accountIds refresh array.
        const oldCachedAccountIds = Object.keys(this.states).filter((k, v) => !accountIds.includes(Number(k)))

        if (oldCachedAccountIds.length) {
            this.app.logger.debug(`${this}SIP subscription unsubscribe cleanup for ${oldCachedAccountIds.length} accounts`)
            for (let accountId of oldCachedAccountIds) {
                this.unsubscribePresence(Number(accountId))
            }
        }

        const accountIdsWithoutState = accountIds.filter((accountId) => !(accountId in this.states))

        if (accountIdsWithoutState.length) {
            this.app.logger.info(`${this}subscribe presence for ${accountIdsWithoutState.length} accounts`)
            this.app.emit('sip:presences.start_update')
            this.app.setState({contacts: {sip: {state: 'updating'}}})

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
