/**
* DTMF key audio generator.
*/
class DtmfTone {
    constructor(freq1, freq2) {
        this.context = new AudioContext()
        this.status = 0
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

    setup() {
        this.osc1.frequency.value = this.freq1
        this.osc2.frequency.value = this.freq2

        this.gainNode = this.context.createGain()
        this.gainNode.gain.value = 0.25

        this.filter = this.context.createBiquadFilter()
        this.filter.type = 'lowpass'

        this.osc1.connect(this.gainNode)
        this.osc2.connect(this.gainNode)

        this.gainNode.connect(this.filter)
        this.filter.connect(this.context.destination)
    }


    start() {
        this.osc1 = this.context.createOscillator()
        this.osc2 = this.context.createOscillator()
        this.setup()
        this.osc1.start(0)
        this.osc2.start(0)
        this.status = 1
    }


    stop() {
        if (this.status === 1) {
            this.osc1.stop(0)
            this.osc2.stop(0)
        }
        this.status = 0
    }

    playKey(key) {
        const frequencyPair = this.frequencies[key]
        this.freq1 = frequencyPair.f1
        this.freq2 = frequencyPair.f2

        if (this.status === 0) {
            this.start()
        }
    }
}


module.exports = {DtmfTone}
