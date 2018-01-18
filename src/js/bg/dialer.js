/**
* The Dialer module. It takes care of actually dialing a phonenumber and
* updating the status about a call.
* @module Dialer
*/
class DialerModule {

    constructor(app, background = true) {
        this.app = app

        /**
        * Used to make the actual call
        */
        this.app.on('dialer:dial', (data) => {
            // Just make sure b_number is numbers only.
            const number = this.sanitizeNumber(data.b_number).replace(/[^\d+]/g, '')

            this.app.sip.call(number)
            if (data.analytics) {
                this.app.telemetry.event('Calls', 'Initiate ConnectAB', data.analytics)
            }
        })
    }


    /**
    * Process number to return a callable phone number.
    * @param {String} number - Number to clean.
    * @returns {String} - The cleaned number.
    */
    sanitizeNumber(number) {
        // Force possible int to string.
        number = '' + number
        // Remove white space characters.
        number = number.replace(/ /g, '')

        // Make numbers like +31(0) work.
        let digitsOnly = number.replace(/[^\d]/g, '')
        if (digitsOnly.substring(0, 3) === '310') {
            if (number.substring(3, 6) === '(0)') {
                number = number.replace(/^\+31\(0\)/, '+31')
            }
        }

        return number
    }


    toString() {
        return `${this.app}[dialer] `
    }
}

module.exports = DialerModule
