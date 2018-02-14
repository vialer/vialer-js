const Call = require('./index')

/**
* Call flow wrapper around SipJS which enables incoming and outgoing
* calls using WebRTC.
*/
class CallConnectab extends Call {

    constructor(module, target, options) {
        super(module, target, options)

        // ConnectAB is a remote call which doesn't have controls in the plugin.
        module.app.__mergeDeep(this.state, {
            hold: {disabled: true}, // No hold functionality.
            keypad: {disabled: true, mode: 'call'}, // No DTMF keypay.
            number: target,
            status: 'new',
            transfer: {disabled: true}, // No transfer functionality.
            type: 'outgoing',
        })


        // Map ConnectAB status codes to the default status codes, which are
        // based on the SIP Call implementation.
        this._statusMap = {
            blacklisted: 'rejected_b',
            confirm: 'accepted',
            connected: 'accepted',
            create: 'dialing_a',
            dialing_a: 'dialing_a', // unique connectab status
            dialing_b: 'dialing_b', // unique connectab status
            disconnected: 'bye',
            failed_a: 'rejected_a',
            failed_b: 'rejected_b',
        }
    }


    /**
    * ConnectAB call status poller.
    */
    async _callStatus() {
        const failedStatus = ['blacklisted', 'disconnected', 'failed_a', 'failed_b']
        const res = await this.app.api.client.get(`api/clicktodial/${this.connectabId}/`)

        if (this.app.api.NOTOK_STATUS.includes(res.status)) {
            this.app.emit('dialer:status.stop', {})
            // Something went wrong. Stop the timer.
            this.app.timer.stopTimer(`dialer:status.update-${this.connectabId}`)
            this.app.timer.unregisterTimer(`dialer:status.update-${this.connectabId}`)
            return
        }


        let connectabStatus = res.data.status
        // Compare with the last callstatus, so we don't
        // perform unnecessary status updates.
        this.setState({status: this._statusMap[connectabStatus]})

        // Start the call the first time a `connected` status is returned.
        if (!this._started && connectabStatus === 'connected') {
            this._start()
        }

        // Stop the status timer when the call is in a final state.
        if (failedStatus.includes(connectabStatus)) {
            // Get rid of the Call.
            this.app.timer.stopTimer(`call:connectab:status-${this.id}`)
            this.app.timer.unregisterTimer(`call:connectab:status-${this.id}`)
            this._stop()
        }
    }

    async _handleOutgoing() {
        super._handleOutgoing()
        // Just make sure b_number is numbers only.

        // Don't send the `a_number`, because we expect the user to have
        // set the Click2dial account. Also, changing the user availability
        // only has effect when the Click2dial account value is `Sync to `
        const res = await this.app.api.client.post('api/clicktodial/', {
            b_number: this.state.number,
        })

        // Stop when an invalid http response is returned.
        if (this.app.api.NOTOK_STATUS.includes(res.status)) {
            this._stop()
        }

        // A ConnectAB call id; not our Vialer-js Call id.
        this.connectabId = res.data.callid
        this.app.timer.registerTimer(`call:connectab:status-${this.id}`, this._callStatus.bind(this))
        this.app.timer.setInterval(`call:connectab:status-${this.id}`, 1000)
        this.app.timer.startTimer(`call:connectab:status-${this.id}`)
    }


    start() {
        this._handleOutgoing()
    }


    // We cannot hold a connectab call; just use a stub.
    hold() {

    }

    // We cannot unhold a connectab call; just use a stub.
    unhold() {

    }
}

module.exports = CallConnectab
