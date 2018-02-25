// Actions shared across components. Don't modify state local component
// state from here.
module.exports = function(app) {

    let helpers = {}

    /**
    * Helper function to determine whether calling functionality
    * should be activated or not. Used both within and outside
    * of components.
    * @returns {Boolean} - Whether calling options are disabled.
    */
    helpers.callingDisabled = function() {
        let _disabled = false
        if (app.state.settings.webrtc.enabled) {
            if (!app.state.settings.webrtc.permission) _disabled = true
            else if (!(app.state.calls.ua.state === 'registered')) _disabled = true
        } else {
            // ConnectAB mode.
            if (!app.state.calls.ua.state === 'connected') _disabled = true
        }
        return _disabled
    }


    /**
    * Checks whether any calls are going on.
    * @returns {Boolean} - Whether one or more calls is active.
    */
    helpers.callOngoing = function() {
        const calls = app.state.calls.calls
        const callIds = Object.keys(calls)
        // Calls component haven't been activated.
        if (!callIds.length) return false
        // User wants to create its first call.
        if (callIds.length === 1 && calls[callIds[0]].status === 'new') {
            return false
        } else return true
    }


    helpers.callsReady = function() {
        let ready = true
        const callIds = Object.keys(app.state.calls.calls)
        for (let callId of callIds) {
            if (!['accepted', 'new'].includes(this.calls[callId].status)) {
                ready = false
            }
        }
        return ready
    }


    helpers.getTranslations = function() {
        const $t = app.$t
        return {
            call: {
                accepted: {
                    hold: $t('On hold'),
                    incoming: $t('Connected'),
                    outgoing: $t('Calling'),
                },
                bye: $t('Call ended'),
                create: $t('Setting up call'),
                dialing_a: $t('Dialing phone A'),
                dialing_b: $t('Dialing phone B'),
                invite: $t('Incoming call'),
                rejected_a: $t('You disconnected'),
                rejected_b: $t('Callee is busy'),
            },
        }
    }

    helpers.sharedMethods = function() {
        return {
            createCall: function(number, start = true, transfer = false) {
                // Empty Calls are allowed (used in the call switcher), but
                // number must specifically be set to `false`. Default Store
                // value `null` and an empty string are not allowed.
                if (number === null || number === '') return
                if (this.callingDisabled) return
                app.emit('bg:calls:call_create', {number: number, start, transfer})
            },
            openHelp: function() {
                if (app.env.isExtension) browser.tabs.create({url: process.env.HOMEPAGE})
                else window.open(process.env.HOMEPAGE, '_blank')
            },
            openPlatformUrl: function(path = '') {
                const token = this.user.platform.tokens.portal
                path = `client/${this.user.client_id}/${path}`
                path = `user/autologin/?token=${token}&username=${this.user.username}&next=/${path}`
                let url = `${app.state.settings.platform.url}${path}`
                if (app.env.isExtension) browser.tabs.create({url: url})
                else window.open(url, '_blank')
            },
            openPopoutView: function() {
                // This is only available in extensions.
                if (app.env.isExtension) {
                    browser.tabs.create({url: browser.runtime.getURL('index.html?popout=true')})
                }
            },
        }
    }

    helpers.sharedComputed = function() {
        return {
            callingDisabled: helpers.callingDisabled,
            callOngoing: helpers.callOngoing,
            callsReady: helpers.callsReady,
            /**
            * Translate a Call status string to a human-readable text.
            * (!)Don't forget to update this function when changes are made
            * to the internal Call state data-structure.
            * @returns {String} - A human-readably translated Call status.
            */
            callStatus: function() {
                const translations = helpers.getTranslations().call
                if (this.call.status === 'accepted') {
                    if (this.call.hold.active) return translations.accepted.hold
                    return translations.accepted[this.call.type]
                }
                return translations[this.call.status]
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
                if (this.minutes.toString().length <= 1) formattedTime = '0'
                formattedTime += `${this.minutes.toString()}:`
                if (this.seconds.toString().length <= 1) formattedTime += '0'
                formattedTime += `${this.seconds.toString()}`
                return formattedTime
            },
            /**
            * Returns non-call specific transfer status for components to use.
            * @returns {Boolean|String} - The transfer status: false, 'ongoing' or 'select'.
            */
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


    helpers.validators = {
        // Regex source: https://github.com/johnotander/domain-regex/blob/master/index.js
        domain: function(e) {
            let res = e.match(/\b((?=[a-z0-9-]{1,63}\.)(xn--)?[a-z0-9]+(-[a-z0-9]+)*\.)+[a-z]{2,63}\b/)
            if (!res) return false
            return true
        },
    }


    /**
    * Set user state to unauthenticated and notify the background.
    */
    helpers.logout = function() {
        app.emit('bg:user:logout')
    }

    return helpers
}
