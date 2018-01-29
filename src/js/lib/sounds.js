/**
* DTMF audio tone generator.
* Source: http://outputchannel.com/post/recreating-phone-sounds-web-audio/
*/
const context = new AudioContext()
const audio = document.createElement('audio')
document.body.prepend(audio)

var source = context.createMediaElementSource(audio)

class DtmfTone {

    constructor(freq1, freq2) {
        this.context = context
        this.started = false
        this.freq1 = freq1
        this.freq2 = freq2

        this.frequencies = {
            '#': {f1: 941, f2: 1477},
            '*': {f1: 941, f2: 1209},
            0: {f1: 941, f2: 1336},
            1: {f1: 697, f2: 1209},
            2: {f1: 697, f2: 1336},
            3: {f1: 697, f2: 1477},
            4: {f1: 770, f2: 1209},
            5: {f1: 770, f2: 1336},
            6: {f1: 770, f2: 1477},
            7: {f1: 852, f2: 1209},
            8: {f1: 852, f2: 1336},
            9: {f1: 852, f2: 1477},
        }

        this.osc1 = this.context.createOscillator()
        this.osc2 = this.context.createOscillator()
    }


    start() {
        this.osc1 = this.context.createOscillator()
        this.osc2 = this.context.createOscillator()

        this.osc1.frequency.setValueAtTime(this.freq1, this.context.currentTime)
        this.osc2.frequency.setValueAtTime(this.freq2, this.context.currentTime)

        this.gainNode = this.context.createGain()
        this.gainNode.gain.setValueAtTime(0.25, this.context.currentTime)

        this.filter = this.context.createBiquadFilter()
        this.filter.type = 'lowpass'

        this.osc1.connect(this.gainNode)
        this.osc2.connect(this.gainNode)

        this.gainNode.connect(this.filter)
        this.filter.connect(this.context.destination)

        this.osc1.start(0)
        this.osc2.start(0)
        this.started = true
    }


    play(key) {
        const frequencyPair = this.frequencies[key]
        this.freq1 = frequencyPair.f1
        this.freq2 = frequencyPair.f2

        if (!this.started) {
            this.start()
        }
    }


    stop() {
        if (this.started) {
            this.osc1.stop(0)
            this.osc2.stop(0)
        }
        this.started = false
    }
}

/**
* Ring-back tone generator.
* Source: http://outputchannel.com/post/recreating-phone-sounds-web-audio/
*/
class RingbackTone {

    constructor(freq1, freq2) {
        this.context = context
        this.status = 0
        this.freq1 = 400
        this.freq2 = 450
        this.started = false
    }


    createRingerLFO() {
        // Create an empty 3 second mono buffer at the
        // sample rate of the AudioContext.
        var channels = 1
        var sampleRate = this.context.sampleRate
        var frameCount = sampleRate * 3
        var myArrayBuffer = this.context.createBuffer(channels, frameCount, sampleRate)

        // getChannelData allows us to access and edit
        // the buffer data and change.
        var bufferData = myArrayBuffer.getChannelData(0)
        for (var i = 0; i < frameCount; i++) {
            // if the sample lies between 0 and 0.4 seconds, or 0.6 and 1
            // second, we want it to be on.
            if ((i / sampleRate > 0 && i / sampleRate < 0.4) || (i / sampleRate > 0.6 && i / sampleRate < 1.0)) {
                bufferData[i] = 0.25
            }
        }

        this.ringerLFOBuffer = myArrayBuffer
    }


    play() {
        this.osc1 = this.context.createOscillator()
        this.osc2 = this.context.createOscillator()
        this.osc1.frequency.setValueAtTime(this.freq1, this.context.currentTime)
        this.osc2.frequency.setValueAtTime(this.freq2, this.context.currentTime)

        this.gainNode = this.context.createGain()
        this.gainNode.gain.setValueAtTime(0.25, this.context.currentTime)

        this.filter = this.context.createBiquadFilter()
        this.filter.type = 'lowpass'

        this.osc1.connect(this.gainNode)
        this.osc2.connect(this.gainNode)
        this.gainNode.connect(this.filter)
        this.filter.connect(this.context.destination)

        this.osc1.start(0)
        this.osc2.start(0)
        this.status = 1
        // set our gain node to 0, because the LFO is callibrated to this level
        this.gainNode.gain.setValueAtTime(0, this.context.currentTime)
        this.status = 1
        this.createRingerLFO()

        this.ringerLFOSource = this.context.createBufferSource()
        this.ringerLFOSource.buffer = this.ringerLFOBuffer
        this.ringerLFOSource.loop = true
        // Connect the ringerLFOSource to the gain Node audio param.
        this.ringerLFOSource.connect(this.gainNode.gain)
        this.ringerLFOSource.start(0)
        this.started = true
    }


    stop() {
        if (!this.started) return
        this.osc1.stop(0)
        this.osc2.stop(0)
        this.status = 0
        this.ringerLFOSource.stop(0)
    }
}


/**
* Play an pre-delivered ogg-file as ringtone.
*/
class RingTone {

    constructor(target) {
        this.audio = new Audio(`ringtones/${target}`)
        // Loop the sound.
        this.audio.addEventListener('ended', function() {
            this.currentTime = 0
            this.play()
        }, false)
    }

    play() {
        this.audio.play()
    }


    stop() {
        this.audio.pause()
        this.audio.currentTime = 0
    }
}


module.exports = {DtmfTone, RingbackTone, RingTone}
