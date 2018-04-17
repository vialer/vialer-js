/**
* Phone tone generators.
* based on: http://outputchannel.com/post/recreating-phone-sounds-web-audio/
* @module Sounds
*/


let context = new AudioContext()


/**
* Generate a european Busy tone.
*/
class BusyTone {

    constructor(app) {
        this.app = app
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

    constructor(app) {
        this.app = app
        this.started = false

        this.audio = new Audio()
        this.dest = context.createMediaStreamDestination()
        this.audio.srcObject = this.dest.stream
        this.audio.play()

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

        // DTMF tones are on the same sink as the headset output.
        const outputSink = this.app.state.settings.webrtc.media.devices.output.selected.id
        if (outputSink) this.audio.setSinkId(outputSink)

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
        filter.connect(this.dest)

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

    constructor(app, region = 'europe') {
        this.app = app
        this.region = region
        this.started = false

        this.audio = new Audio()
        this.dest = context.createMediaStreamDestination()
        this.audio.srcObject = this.dest.stream
        this.audio.play()
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

        // The Ringback tone is on the same sink as the headset output.
        const outputSink = this.app.state.settings.webrtc.media.devices.output.selected.id
        if (outputSink) this.audio.setSinkId(outputSink)

        let freq1, freq2


        let gainNode = context.createGain()


        if (this.region === 'europe') {
            freq1 = 425
            this.oscillator = context.createOscillator()
            this.oscillator.type = 'sine'
            this.oscillator.connect(gainNode)
            gainNode.connect(this.dest)
            this.oscillator.connect(gainNode)
            this.oscillator.start(0)
            this.oscillator.frequency.setValueAtTime(freq1, context.currentTime)
        } else if (this.region === 'uk') {
            freq1 = 400
            freq2 = 450

            this.oscillator = context.createOscillator()
            this.oscillator.frequency.setValueAtTime(freq2, context.currentTime)
            this.oscillator.connect(gainNode)

            let filter = context.createBiquadFilter()
            filter.type = 'lowpass'
            filter.connect(this.dest)
            gainNode.connect(filter)

            this.oscillator.start(0)
        }



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
        this.oscillator.stop(0)
        this.ringerLFOSource.stop(0)
        this.started = false
    }
}


/**
* Play a pre-delivered ogg-file as ringtone.
*/
class RingTone extends EventEmitter {

    constructor(app) {
        super()
        this.app = app
        this.audio = new Audio(`ringtones/${app.state.settings.ringtones.selected.name}`)
        this.audio.addEventListener('ended', this.playEnd.bind(this))
    }


    play(loop = true) {
        this.loop = loop
        const soundSink = this.app.state.settings.webrtc.media.devices.sounds.selected.id
        if (soundSink) {
            this.audio.setSinkId(this.app.state.settings.webrtc.media.devices.sounds.selected.id)
        }

        // Loop the sound.
        if (loop) {
            this.audio.addEventListener('ended', () => {
                this.playing = false

            }, false)
        }


        this.audio.play()
        this.playing = true
    }


    playEnd() {
        this.emit('stop')
        this.playing = false

        if (this.loop) {
            this.playing = true
            this.audio.currentTime = 0
            this.audio.play()
        }
    }


    stop() {
        this.audio.pause()
        this.audio.currentTime = 0
        this.playing = false
    }
}

module.exports = class Sounds {

    constructor(app) {
        this.app = app
        this.context = context

        this.busyTone = new BusyTone(app)
        this.dtmfTone = new DtmfTone(app)
        this.ringbackTone = new RingbackTone(app)
        this.ringTone = new RingTone(app)
    }
}
