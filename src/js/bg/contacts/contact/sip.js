const Contact = require('./index')
const PresenceSip = require('./presence/sip')


class ContactSip extends Contact {
    constructor(app, state) {
        super(app, state)

        this.state = {
            id: state.account_id,
            name: state.callerid_name,
            number: state.internal_number,
            state: '',
            userAgent: state.sipreginfo.useragent,
        }

        this.presence = new PresenceSip(this, app.modules.calls)

        if (['registered', 'connected'].includes(app.state.calls.ua.state)) {
            // Must be registered when using webrtc, otherwise it's an invalid
            // registration. The 'connected' state for platform integration is
            // enough otherwise.
            if (app.state.settings.webrtc.enabled) {
                if (app.state.calls.ua.state === 'registered') this.presence.subscribe()
            } else {
                if (app.state.calls.ua.state === 'connected') this.presence.subscribe()
            }
        }

        this.setState(this.state)
    }
}

module.exports = ContactSip
