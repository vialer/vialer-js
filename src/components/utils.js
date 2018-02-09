// Actions shared across components. Don't modify state local component
// state from here.
module.exports = function(app) {

    let utils = {}

    utils.getTranslations = function() {
        const $t = app.$t
        return {
            call: {
                accepted: {
                    hold: $t('On hold'),
                    incoming: $t('Connected'),
                    outgoing: $t('Calling'),
                },
                bye: $t('Call ended'),
                create: $t('Calling'),
                invite: $t('Incoming call'),
                rejected: $t('Declined'),
            },
        }
    }

    utils.sharedMethods = function() {
        return {
            getActiveCall: function() {
                let activeCall = null
                const calls = this.$store.calls.calls
                const callKeys = Object.keys(calls)
                for (let callId of callKeys) {
                    if (calls[callId].active) {
                        activeCall = calls[callId]
                    }
                }
                return activeCall
            },
            openPlatformUrl: function(path = '') {
                const token = this.user.platform.tokens.portal
                path = `client/${this.user.client_id}/${path}`
                path = `user/autologin/?token=${token}&username=${this.user.username}&next=/${path}`
                let url = `${app.state.settings.platform.url}${path}`
                if (app.env.isExtension) browser.tabs.create({url: url})
                else window.open(url, '_blank')
            },
            transferActivate: function(number) {
                if (!number) return
                let activeCall = this.getActiveCall()
                app.emit('bg:calls:transfer_activate', {callId: activeCall.id, number: number})
            },
        }
    }

    utils.sharedComputed = function() {
        return {
            callsActive: function() {
                const calls = this.$store.calls.calls
                const callIds = Object.keys(this.$store.calls.calls)
                // Calls component haven't been activated.
                if (!callIds.length) return false
                // User wants to create its first call.
                if (callIds.length === 1 && calls[callIds[0]].status === 'new') return false
                return true
            },
            callStatus: function() {
                const translations = utils.getTranslations()
                if (this.call.status === 'accepted') {
                    if (this.call.hold) {
                        return translations.call.accepted.hold
                    }

                    return translations.call.accepted[this.call.type]
                }
                return translations.call[this.call.status]
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
                if (callKeys.length > 1) {
                    for (let callId of callKeys) {
                        if (calls[callId].transfer.active) {
                            transferStatus = 'select'
                        }
                    }
                }
                return transferStatus
            },
        }
    }


    /**
    * Set user state to unauthenticated and notify the background.
    */
    utils.logout = function() {
        app.emit('bg:user:logout')
    }

    return utils
}
