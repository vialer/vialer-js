/** @memberof lib */

/**
* Actions shared across components. Don't modify state
* local component state from here.
*/

/**
* Closure method that makes the app context available
* to all inner methods.
* @param {App} app - The application object.
* @returns {Object} - The application's common helpers.
* @memberof App
*/
function helpers(app) {

    const closingStatus = ['answered_elsewhere', 'rejected_a', 'rejected_b', 'bye']

    let _helpers = {}

    _helpers.activeCall = function() {
        let activeCall = null
        for (const id of Object.keys(this.calls)) {
            if (this.calls[id].active) activeCall = this.calls[id]
        }

        // Fallback to the first call in case there is no active call at all.
        if (!activeCall) {
            if (Object.keys(this.calls).length === 0) {
                app.emit('bg:calls:call_create', {
                    callback: ({call}) => {
                        activeCall = call
                    }, number: null, start: null})
            }
        }
        return activeCall
    }

    /**
    * Helper function to determine whether calling functionality
    * should be activated or not. Used both within and outside
    * of components.
    * @returns {Boolean} - Whether calling options are disabled.
    */
    _helpers.callingDisabled = function() {
        let errors = []

        if (!app.state.app.online) errors.push('offline')
        if (app.state.settings.webrtc.enabled) {
            if (!app.state.settings.webrtc.media.permission) errors.push('mediaPermission')
            else if (!(app.state.calls.ua.status === 'registered')) errors.push('unregistered')
        } else {
            // ConnectAB mode.
            if (!app.state.calls.ua.status === 'connected') errors.push('disconnected')
        }

        if (!errors.length) return false
        else return errors
    }


    /**
    * Filter and return all ids of Calls that are
    * in a closing state.
    * @returns {Array} - Closing Call ids.
    */
    _helpers.callsClosing = function() {
        const calls = app.state.calls.calls
        return Object.keys(calls).filter((i) => closingStatus.includes(calls[i].status))
    }


    /**
    * An ongoing Call is a Call that is either ongoing or
    * in the process of being closed.
    * @returns {Boolean} - Whether one or more calls is active.
    */
    _helpers.callOngoing = function() {
        const calls = app.state.calls.calls
        const callIds = Object.keys(calls)

        for (const callId of callIds) {
            const status = calls[callId].status
            // An active Call is not a new Call, but may be a closing Call.
            if (status !== 'new') return true
        }

        return false
    }


    /**
    * Flag used to check whether some call actions can be shown.
    * This is done by checking if there are Calls that don't have
    * state `accepted` or `new`. In that case, the call action should
    * be disabled.
    * @returns {Boolean} - Whether
    */
    _helpers.callsReady = function() {
        let ready = true
        const callIds = Object.keys(app.state.calls.calls)
        for (let callId of callIds) {
            if (!['accepted', 'new'].includes(this.calls[callId].status)) {
                ready = false
            }
        }
        return ready
    }


    _helpers.getTranslations = function() {
        const $t = app.$t
        return {
            call: {
                accepted: {
                    hold: $t('on hold'),
                    incoming: $t('calling'),
                    outgoing: $t('calling'),
                },
                answered_elsewhere: $t('answered elsewhere'),
                bye: $t('call ended'),
                create: $t('setting up call'),
                dialing_a: $t('dialing phone A'),
                dialing_b: $t('dialing phone B'),
                invite: $t('incoming call'),
                rejected_a: $t('you disconnected'),
                rejected_b: $t('callee is busy'),
            },
            callingDisabled: {
                disconnected: $t('You are disconnected from the SIP service.'),
                mediaPermission: $t('Go to Audio settings and give the browser permission to use your microphone.'),
                offline: $t('You are disconnected from the internet. Check your connectivity.'),
                unregistered: $t('Not registered at the SIP service. Check your connectivity.'),
            },
        }
    }

    /**
        * Find the contact related to a calling number.
        * @param {String} number - The number to look for.
        * @param {Boolean} partial - Return the first matching number.
        * @returns {Object|null} - Contact and Endpoint Id or null.
        */
    _helpers.matchContact = function(number, partial = false) {
        const contacts = app.state.contacts.contacts
        for (const contactId of Object.keys(contacts)) {
            for (const endpointId of Object.keys(contacts[contactId].endpoints)) {
                const endpoint = contacts[contactId].endpoints[endpointId]
                if (partial) {
                    if (String(endpoint.number).includes(number)) {
                        return {contact: contacts[contactId].id, endpoint: endpoint.id}
                    }
                } else {
                    if (String(endpoint.number) === number) return {contact: contacts[contactId].id, endpoint: endpoint.id}
                }
            }
        }

        return null
    }


    _helpers.sharedMethods = function() {

        return {
            closeOverlay: function() {
                app.setState({ui: {overlay: null}}, {encrypt: false, persist: true})
            },
            createCall: function(number, start = true, transfer = false) {
                if (!this.user.authenticated) return false
                // Empty Calls are allowed (used in the call switcher), but
                // number must specifically be set to `false`. Default Store
                // value `null` and an empty string are not allowed.
                if (number === null || number === '') return false
                if (this.callingDisabled) return false
                app.emit('bg:calls:call_create', {number, start, transfer})
                return number
            },
            getTranslations: _helpers.getTranslations,
            openPlatformUrl: function(path = '') {
                app.emit('bg:user:update-token', {
                    callback: ({token}) => {
                        path = `client/${this.user.client_id}/${path}`
                        path = `user/autologin/?token=${token}&username=${this.user.username}&next=/${path}`
                        let url = `${app.state.settings.platform.url}${path}`
                        if (app.env.isExtension) browser.tabs.create({url: url})
                        window.open(url, '_blank')
                    },
                })
            },
            openPopoutView: function() {
                // This is only available in extensions.
                if (app.env.isExtension) {
                    browser.tabs.create({url: browser.runtime.getURL('index.html?popout=true')})
                }
            },
            openTab: function(url) {
                if (app.env.isExtension) browser.tabs.create({url})
                else window.open(url, '_blank')
            },
            setLayer: function(layerName) {
                app.setState({ui: {layer: layerName}}, {encrypt: false, persist: true})
            },
            setOverlay: function(layerName) {
                app.setState({ui: {overlay: layerName}}, {encrypt: false, persist: true})
            },
            setTab: function(category, name, condition = true) {
                if (!condition) return
                app.setState({ui: {tabs: {[category]: {active: name}}}}, {encrypt: false, persist: true})
            },
            translations: function(category, key) {
                if (!this._translations) this._translations = this.getTranslations()
                return this._translations[category][key]
            },
        }
    }


    /**
    * Shared computed properties for Vue components.
    * Be aware that using these properties also require
    * your Vue components to provide all the expected
    * properties from the store.
    * @returns {Object} - Commonly used shared properties.
    */
    _helpers.sharedComputed = function() {
        return {
            activeCall: _helpers.activeCall,
            callingDisabled: _helpers.callingDisabled,
            callOngoing: _helpers.callOngoing,
            callsReady: _helpers.callsReady,
            callStatus: function() {
                const translations = _helpers.getTranslations().call
                if (this.call.status === 'accepted') {
                    if (this.call.hold.active) return translations.accepted.hold
                    return translations.accepted[this.call.type]
                }
                return translations[this.call.status]
            },
            greeting: function() {
                let hours = new Date().getHours()
                if (hours < 12) return this.$t('Good Morning')
                else if (hours >= 12 && hours <= 17) return this.$t('Good Afternoon')
                else return this.$t('Good Evening')
            },
            hours: function() {
                return Math.trunc((this.call.timer.current - this.call.timer.start) / 1000 / 60 / 60) % 24
            },
            minutes: function() {
                return Math.trunc((this.call.timer.current - this.call.timer.start) / 1000 / 60) % 60
            },
            numbersOngoing: function() {
                let numbers = []
                const calls = this.$store.calls.calls
                for (let callId of Object.keys(calls)) {
                    numbers.push(parseInt(calls[callId].number))
                }
                return numbers
            },
            seconds: function() {
                return Math.trunc((this.call.timer.current - this.call.timer.start) / 1000) % 60
            },
            sessionTime: function() {
                let formattedTime
                if (this.minutes <= 9) formattedTime = `0${this.minutes}`
                else formattedTime = `${this.minutes}`
                if (this.seconds <= 9) formattedTime = `${formattedTime}:0${this.seconds}`
                else formattedTime = `${formattedTime}:${this.seconds}`
                return formattedTime
            },
            transferStatus: function() {
                let transferStatus = false
                const calls = this.$store.calls.calls
                const callKeys = Object.keys(calls)

                for (let callId of callKeys) {
                    if (calls[callId].transfer.active) {
                        transferStatus = 'select'
                    }
                }
                return transferStatus
            },
        }
    }


    _helpers.validators = {
        // Regex source: https://github.com/johnotander/domain-regex/blob/master/index.js
        domain: function(e) {
            e = e ? e : ''
            let res = e.match(/\b((?=[a-z0-9-]{1,63}\.)(xn--)?[a-z0-9]+(-[a-z0-9]+)*\.)+[a-z]{2,63}\b/)
            if (!res) return false
            return true
        },
    }


    /**
    * Set user state to unauthenticated and notify the background.
    */
    _helpers.logout = function() {
        app.emit('bg:user:logout')
    }

    return _helpers
}


module.exports = helpers
