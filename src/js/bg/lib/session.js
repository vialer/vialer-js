/**
* Common Session class for Click-to-dial and WebRTC calling.
*/
class Session {

    constructor(...args) {
        Object.assign(this, args)
    }


    muteRingtone() {
        this.ringtone.pause()
        this.ringtone.currentTime = 0
    }


    playRingtone() {
        this.ringtone = new Audio(`ringtones/${this.app.state.settings.ringtones.selected.name}`)
        this.ringtone.addEventListener('ended', function() {
            this.currentTime = 0
            this.play()
        }, false)
        this.ringtone.play()
    }


    resetState() {
        window.setTimeout(() => {
            this.app.setState({sip: this.app.getDefaultState().sip})
        }, 3000)
    }
}


module.exports = Session
