const Contact = require('./index')
const PresenceSip = require('./presence/sip')


class ContactSip extends Contact {
    constructor(app, state) {
        super(app, state)

        this.state = {
            id: state.account_id,
            name: state.callerid_name,
            number: state.internal_number,
            status: state.sipreginfo ? 'unavailable' : 'unregistered',
            userAgent: state.sipreginfo ? state.sipreginfo.useragent : this.app.$t('Not available'),
        }

        if (state.sipreginfo) this.presence = new PresenceSip(this, app.modules.calls)
        this.setState(this.state)
    }
}

module.exports = ContactSip
