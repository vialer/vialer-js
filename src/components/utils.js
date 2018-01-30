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
            transferActivate: function(number) {
                if (!this.number) return
                app.emit('bg:sip:transfer_activate', {callId: this.call.id, number: this.number})
            },
        }
    }

    utils.sharedComputed = function() {
        return {
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

            transferOngoing: function() {
                let transferOngoing = false
                const calls = this.$store.sip.calls
                for (let callId of Object.keys(calls)) {
                    if (calls[callId].transfer.active) transferOngoing = true
                }
                return transferOngoing
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
