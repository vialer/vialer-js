<div class="c-dialpad">
    <div class="dialpad-input">
        <input type="text" @keyup="stopDtmf()" @keydown="playDtmf(null, $event)" v-model="module.dialNumber"/>
        <i class="fa fa-angle-double-left" @click="removeLastNumber"></i>
    </div>

    <div class="numbers">
        <button class="key" @mouseup="stopDtmf()" @mousedown="playDtmf(1)">1</button>
        <button class="key" @mouseup="stopDtmf()" @mousedown="playDtmf(2)">2<div class="sub">ABC</div></button>
        <button class="key" @mouseup="stopDtmf()" @mousedown="playDtmf(3)">3<div class="sub">DEF</div></button>
        <button class="key" @mouseup="stopDtmf()" @mousedown="playDtmf(4)">4<div class="sub">GHI</div></button>
        <button class="key" @mouseup="stopDtmf()" @mousedown="playDtmf(5)">5<div class="sub">JKL</div></button>
        <button class="key" @mouseup="stopDtmf()" @mousedown="playDtmf(6)">6<div class="sub">MNO</div></button>
        <button class="key" @mouseup="stopDtmf()" @mousedown="playDtmf(7)">7<div class="sub">PQRS</div></button>
        <button class="key" @mouseup="stopDtmf()" @mousedown="playDtmf(8)">8<div class="sub">TUV</div></button>
        <button class="key" @mouseup="stopDtmf()" @mousedown="playDtmf(9)">9<div class="sub">WXYZ</div></button>
        <button class="key" @mouseup="stopDtmf()" @mousedown="playDtmf('#')">#</button>
        <button class="key" @mouseup="stopDtmf()" @mousedown="playDtmf(0)">0<div class="sub">+</div></button>
        <button class="key" @mouseup="stopDtmf()" @mousedown="playDtmf('*')">*</button>
    </div>
    <div class="field is-grouped is-grouped-centered">
        <p class="control">
            <span class="dial-button fa-stack fa-3x" @click="dialNumber()">
              <i class="fa fa-circle fa-stack-2x"></i>
              <i class="fa fa-phone fa-stack-1x fa-inverse"></i>
            </span>
        </p>
    </div>
</div>
