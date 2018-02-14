const ConnectabCall = require('./connectab')
const SipCall = require('./sip')

/**
* Produce a Call implementation based on the application's
* conditions like whether WebRTC calling is enabled or
* when a ConnectAB call is required. The Factory should always
* be used to create nre Calls with.
* @param {CallsModule} module - The Calls module reference.
* @param {String} callTarget - Target for the Call constructor.
* @param {String} callOptions - Options to pass to the Call constructor.
* @param {String} callType - Force to create a type of Call.
* @returns {Call} - A type of Call, currently `SIP` or `Connectab`.
*/
function callFactory(module, callTarget = null, callOptions = {}, callType = null) {
    const app = module.app
    // Return a specific type of Call when requested.
    let call = null

    if (callType) {
        if (callType === 'CallSIP') {
            call = new SipCall(module, callTarget, callOptions)
        } else if (callType === 'ConnectAB') {
            call = new ConnectabCall(module, callTarget, callOptions)
        }
    } else {
        // Let application state decide.
        if (app.state.calls.ua.state === 'registered') {
            call = new SipCall(module, callTarget, callOptions)
        } else if (app.state.user.authenticated) {
            // The user at least has access to the vendor API and should
            // be able to place a Connectab call.
            call = new ConnectabCall(module, callTarget, callOptions)
        } else {
            // This shouldn't happen. Make some noise if it does.
            throw 'Factory couldn\'t produce a valid Call target!'
        }
    }

    if (call) this.app.logger.debug(`${this}generate ${call.constructor.name} from factory.`)
    return call
}

module.exports = callFactory
