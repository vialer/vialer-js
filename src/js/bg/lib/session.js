/**
* Common Session class for Click-to-dial and WebRTC calling.
*/
class Session {

    constructor(...args) {
        Object.assign(this, args)
    }


    muteRingtone() {
        this.ringtone.stop()
    }


    playRingtone() {
        this.ringtone = new this.app.sounds.RingTone(this.app.state.settings.ringtones.selected.name)
        this.ringtone.play()
    }


    resetState() {
        window.setTimeout(() => {
            this.app.setState({sip: this.app.getDefaultState().sip})
            delete this.session
        }, 3000)
    }
}


module.exports = Session
