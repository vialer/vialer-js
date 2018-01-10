<div class="c-dialpad">
    <input class="input" type="text" :placeholder="$t('Who you ganna call?')"
    @keyup="stopDtmf()" @keydown="playDtmf(null, $event)"
    v-model="module.dialNumber"/>
    <div class="numbers">
        <button class="keys" @mouseup="stopDtmf()" @mousedown="playDtmf(1)">1</button>
        <button class="keys" @mouseup="stopDtmf()" @mousedown="playDtmf(2)">2</button>
        <button class="keys" @mouseup="stopDtmf()" @mousedown="playDtmf(3)">3</button>
        <button class="keys" @mouseup="stopDtmf()" @mousedown="playDtmf(4)">4</button>
        <button class="keys" @mouseup="stopDtmf()" @mousedown="playDtmf(5)">5</button>
        <button class="keys" @mouseup="stopDtmf()" @mousedown="playDtmf(6)">6</button>
        <button class="keys" @mouseup="stopDtmf()" @mousedown="playDtmf(7)">7</button>
        <button class="keys" @mouseup="stopDtmf()" @mousedown="playDtmf(8)">8</button>
        <button class="keys" @mouseup="stopDtmf()" @mousedown="playDtmf(9)">9</button>
        <button class="keys" @mouseup="stopDtmf()" @mousedown="playDtmf('#')">#</button>
        <button class="keys" @mouseup="stopDtmf()" @mousedown="playDtmf(0)">0</button>
        <button class="keys" @mouseup="stopDtmf()" @mousedown="playDtmf('*')">*</button>
    </div>
    <div class="actions">
        <i class="dial icon-availability" @click="dialNumber()"></i>
    </div>
</div>
