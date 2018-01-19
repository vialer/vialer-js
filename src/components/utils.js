// Actions shared across components. Don't modify state local component
// state from here.
module.exports = function(app) {

    let utils = {}

    utils.getTranslations = function() {
        const $t = app.$t
        return {
            sip: {
                accepted: {
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

    utils.sharedComputed = function() {
        return {
            callStatus: function() {
                const translations = utils.getTranslations()
                if (this.sip.session.state === 'accepted') {
                    return translations.sip.accepted[this.sip.session.type]
                }
                return translations.sip[this.sip.session.state]
            },
            hours: function() {
                return Math.trunc((this.sip.session.timer.current - this.sip.session.timer.start) / 1000 / 60 / 60) % 24
            },
            minutes: function() {
                return Math.trunc((this.sip.session.timer.current - this.sip.session.timer.start) / 1000 / 60) % 60
            },
            seconds: function() {
                return Math.trunc((this.sip.session.timer.current - this.sip.session.timer.start) / 1000) % 60
            },
            sessionTime: function() {
                let formattedTime
                if (this.minutes.toString().length <= 1) formattedTime = '0'
                formattedTime += `${this.minutes.toString()}:`
                if (this.seconds.toString().length <= 1) formattedTime += '0'
                formattedTime += `${this.seconds.toString()}`
                return formattedTime
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
