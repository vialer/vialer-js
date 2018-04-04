/**
* @module Sounds
*/

/**
* Phone tone generators.
* based on: http://outputchannel.com/post/recreating-phone-sounds-web-audio/
*/
let context = null


/**
* Generate a european Busy tone.
*/
class BusyTone {

    constructor() {
        if (!context) context = new AudioContext()
    }

    createRingerLFO() {
        let channels = 1
        let sampleRate = context.sampleRate
        let frameCount = sampleRate * 1
        let arrayBuffer = context.createBuffer(channels, frameCount, sampleRate)
        let bufferData = arrayBuffer.getChannelData(0)
        for (let i = 0; i < frameCount; i++) {
            // Do not use the full amplitude here.
            if ((i / sampleRate > 0 && i / sampleRate < 0.5)) bufferData[i] = 0.5
        }

        return arrayBuffer
    }



    play(key) {
        if (this.started) return
        const gainNode = context.createGain()
        gainNode.connect(context.destination)
        this.oscillator = context.createOscillator()
        this.oscillator.connect(gainNode)

        this.oscillator.type = 'sine'
        this.oscillator.frequency.setValueAtTime(450, context.currentTime)
        gainNode.gain.setValueAtTime(0, context.currentTime)

        this.ringerLFOSource = context.createBufferSource()
        this.ringerLFOSource.buffer = this.createRingerLFO()
        this.ringerLFOSource.loop = true
        this.ringerLFOSource.connect(gainNode.gain)
        this.ringerLFOSource.start(0)

        this.oscillator.start()
        this.started = true
    }


    stop() {
        if (this.started) {
            this.oscillator.stop(0)
            this.ringerLFOSource.stop(0)
        }
        this.started = false
    }
}


/**
* Generate a DTMF tone.
*/
class DtmfTone {

    constructor() {
        if (!context) context = new AudioContext()
        this.started = false

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
    }


    play(key) {
        if (this.started) return

        const frequencyPair = this.frequencies[key]
        this.freq1 = frequencyPair.f1
        this.freq2 = frequencyPair.f2

        this.osc1 = context.createOscillator()
        this.osc2 = context.createOscillator()
        this.osc1.frequency.setValueAtTime(this.freq1, context.currentTime)
        this.osc2.frequency.setValueAtTime(this.freq2, context.currentTime)

        let gainNode = context.createGain()
        gainNode.gain.setValueAtTime(0.25, context.currentTime)
        let filter = context.createBiquadFilter()
        filter.type = 'lowpass'

        this.osc1.connect(gainNode)
        this.osc2.connect(gainNode)
        gainNode.connect(filter)
        filter.connect(context.destination)

        this.osc1.start(0)
        this.osc2.start(0)
        this.started = true
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
* Ring-back tone generator for UK and Europe regions.
*/
class RingbackTone {

    constructor(region = 'europe') {
        if (!context) context = new AudioContext()
        this.region = region
        this.started = false
    }


    createRingerLFO() {
        // Create an empty 3 second mono buffer at the sample rate of the AudioContext.
        let channels = 1
        let frameCount
        let sampleRate = context.sampleRate
        if (this.region === 'uk') frameCount = sampleRate * 3
        else if (this.region === 'europe') frameCount = sampleRate * 5
        let arrayBuffer = context.createBuffer(channels, frameCount, sampleRate)

        // getChannelData allows us to access and edit
        // the buffer data and change.
        let bufferData = arrayBuffer.getChannelData(0)
        for (let i = 0; i < frameCount; i++) {
            // We want it to be on if the sample lies between 0 and 0.4 seconds,
            // or 0.6 and 1 second.
            if (this.region === 'europe') {
                if ((i / sampleRate > 0 && i / sampleRate < 1)) {
                    bufferData[i] = 0.5
                }
            } else if (this.region === 'uk') {
                if ((i / sampleRate > 0 && i / sampleRate < 0.4) || (i / sampleRate > 0.6 && i / sampleRate < 1.0)) {
                    bufferData[i] = 0.25
                }
            }
        }

        return arrayBuffer
    }


    play() {
        if (this.started) return
        let freq1, freq2

        this.oscillator1 = context.createOscillator()
        let gainNode = context.createGain()
        this.oscillator1.connect(gainNode)

        if (this.region === 'europe') {
            freq1 = 425
            this.oscillator1.type = 'sine'
            gainNode.connect(context.destination)
            this.oscillator1.connect(gainNode)
            this.oscillator1.start(0)
        } else if (this.region === 'uk') {
            freq1 = 400
            freq2 = 450

            this.oscillator2 = context.createOscillator()
            this.oscillator2.frequency.setValueAtTime(freq2, context.currentTime)
            this.oscillator2.connect(gainNode)

            let filter = context.createBiquadFilter()
            filter.type = 'lowpass'
            filter.connect(context.destination)
            gainNode.connect(filter)
            this.oscillator2.start(0)
        }

        this.oscillator1.frequency.setValueAtTime(freq1, context.currentTime)

        gainNode.gain.setValueAtTime(0, context.currentTime)
        this.ringerLFOSource = context.createBufferSource()
        this.ringerLFOSource.buffer = this.createRingerLFO()
        this.ringerLFOSource.loop = true

        this.ringerLFOSource.connect(gainNode.gain)
        this.ringerLFOSource.start(0)
        this.started = true
    }


    stop() {
        if (!this.started) return
        this.oscillator1.stop(0)
        if (this.region === 'uk') this.oscillator2.stop(0)
        this.ringerLFOSource.stop(0)
        this.started = false
    }
}


/**
* Play a pre-delivered ogg-file as ringtone.
*/
class RingTone extends EventEmitter {

    constructor(target, loop = true) {
        if (!context) context = new AudioContext()
        super()
        this.audio = new Audio(`ringtones/${target}`)
        // Loop the sound.
        this.audio.addEventListener('ended', () => {
            this.emit('stop')
            if (loop) {
                this.audio.currentTime = 0
                this.audio.play()
            }
        }, false)
    }


    play() {
        this.audio.play()
        this.emit('play')
    }


    stop() {
        this.audio.pause()
        this.audio.currentTime = 0
        this.emit('stop')
    }
}

module.exports = {BusyTone, DtmfTone, RingbackTone, RingTone}
