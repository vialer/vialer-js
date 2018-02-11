/**
* Phone tone generators.
* based on: http://outputchannel.com/post/recreating-phone-sounds-web-audio/
*/
const context = new AudioContext()


class DtmfTone {

    constructor() {
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
        var arrayBuffer = context.createBuffer(channels, frameCount, sampleRate)

        // getChannelData allows us to access and edit
        // the buffer data and change.
        let bufferData = arrayBuffer.getChannelData(0)
        for (let i = 0; i < frameCount; i++) {
            // We want it to be on if the sample lies between 0 and 0.4 seconds,
            // or 0.6 and 1 second.
            if (this.region === 'europe') {
                if ((i / sampleRate > 0 && i / sampleRate < 1)) {
                    bufferData[i] = 1
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
        let analyser, distortion, filter, freq1, freq2

        this.osc1 = context.createOscillator()
        let gainNode = context.createGain()
        this.osc1.connect(gainNode)

        if (this.region === 'europe') {
            freq1 = 425
            analyser = context.createAnalyser()
            distortion = context.createWaveShaper()
            this.osc1.connect(distortion)
            this.osc1.type = 'sine'
            analyser.connect(gainNode)
            gainNode.connect(context.destination)
        } else if (this.region === 'uk') {
            freq1 = 400
            freq2 = 450

            this.osc2 = context.createOscillator()
            this.osc2.frequency.setValueAtTime(freq2, context.currentTime)
            this.osc2.connect(gainNode)

            filter = context.createBiquadFilter()
            filter.type = 'lowpass'
            filter.connect(context.destination)
            gainNode.connect(filter)
            this.osc2.start(0)
        }

        this.osc1.frequency.setValueAtTime(freq1, context.currentTime)
        this.osc1.start(0)

        // set our gain node to 0, because the LFO is callibrated to this level
        gainNode.gain.setValueAtTime(0, context.currentTime)

        this.ringerLFOSource = context.createBufferSource()
        this.ringerLFOSource.buffer = this.createRingerLFO()
        this.ringerLFOSource.loop = true
        // Connect the ringerLFOSource to the gain Node audio param.
        this.ringerLFOSource.connect(gainNode.gain)
        this.ringerLFOSource.start(0)
        this.started = true
    }


    stop() {
        if (!this.started) return
        this.osc1.stop(0)
        if (this.region === 'uk') this.osc2.stop(0)
        this.ringerLFOSource.stop(0)
        this.started = false
    }
}


/**
* Play an pre-delivered ogg-file as ringtone.
*/
class RingTone extends EventEmitter {

    constructor(target, loop = true) {
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


/**
*  Copyright (c) 2015 The WebRTC project authors. All Rights Reserved.
*
*  Use of this source code is governed by a BSD-style license
*  that can be found in the LICENSE file in the root of the source
*  tree.
*
* Meter class that generates a number correlated to audio volume.
* The meter class itself displays nothing, but it makes the
* instantaneous and time-decaying volumes available for inspection.
* It also reports on the fraction of samples that were at or near
* the top of the measurement range.
*/
class SoundMeter {

    constructor() {
        this.instant = 0.0
        this.slow = 0.0
        this.clip = 0.0
        this.script = context.createScriptProcessor(2048, 1, 1)
        var that = this
        this.script.onaudioprocess = function(event) {
            var input = event.inputBuffer.getChannelData(0)
            var i
            var sum = 0.0
            var clipcount = 0
            for (i = 0; i < input.length; ++i) {
                sum += input[i] * input[i]
                if (Math.abs(input[i]) > 0.99) {
                    clipcount += 1
                }
            }
            that.instant = Math.sqrt(sum / input.length)
            that.slow = 0.95 * that.slow + 0.05 * that.instant
            that.clip = clipcount / input.length
        }
    }

    connectToSource(stream, callback) {
        this.mic = context.createMediaStreamSource(stream)
        this.mic.connect(this.script)
        // necessary to make sample run, but should not be.
        this.script.connect(context.destination)
    }

    stop() {
        this.mic.disconnect()
        this.script.disconnect()
    }
}




module.exports = {DtmfTone, RingbackTone, RingTone, SoundMeter}
