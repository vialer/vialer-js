const ConnectABCall = require('./connectab')
const SipCall = require('./sip')


module.exports = function(app) {
    /**
    * Produce a Call instance based on the application's
    * conditions like whether WebRTC calling is enabled or
    * when a ConnectAB call is required. The Factory should
    * always be used to create Calls with.
    * @param {String} target - Target for the Call constructor.
    * @param {String} options - Options to pass to the Call constructor.
    * @param {String} type - Force to create a type of Call.
    * @returns {Call} - A type of Call, currently `CallSIP` or `CallConnectAB`.
    * @memberof app.modules.calls
    */
    function callFactory(target = null, options = {}, type = null) {
        // Return a specific type of Call when requested.
        let call = null

        if (type) {
            if (type === 'CallSIP') {
                call = new SipCall(app, target, options)
            } else if (type === 'ConnectAB') {
                call = new ConnectABCall(app, target, options)
            }
        } else {
            // Let application state decide.
            if (app.state.user.authenticated) {
                if (app.state.settings.webrtc.enabled) {
                    call = new SipCall(app, target, options)
                } else {
                    // Fallback to the vendor API.
                    call = new ConnectABCall(app, target, options)
                }
            }
        }

        if (call) return call
        throw 'Factory couldn\'t produce a valid Call target!'
    }

    return callFactory
}
