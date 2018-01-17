<div class="keypad-component">
    <div class="number-input">
        <input type="text" @keyup="unpressKey()" @keydown="pressKey($event.key)" v-bind:value="number" v-on:input="inputChange($event.target.value)"/>
        <i class="fa fa-angle-double-left" @click="removeLastNumber"></i>
    </div>

    <div class="numbers">
        <button class="key" @mouseup="unpressKey()" @mousedown="pressKey(1)">1</button>
        <button class="key" @mouseup="unpressKey()" @mousedown="pressKey(2)">2<div class="sub">ABC</div></button>
        <button class="key" @mouseup="unpressKey()" @mousedown="pressKey(3)">3<div class="sub">DEF</div></button>
        <button class="key" @mouseup="unpressKey()" @mousedown="pressKey(4)">4<div class="sub">GHI</div></button>
        <button class="key" @mouseup="unpressKey()" @mousedown="pressKey(5)">5<div class="sub">JKL</div></button>
        <button class="key" @mouseup="unpressKey()" @mousedown="pressKey(6)">6<div class="sub">MNO</div></button>
        <button class="key" @mouseup="unpressKey()" @mousedown="pressKey(7)">7<div class="sub">PQRS</div></button>
        <button class="key" @mouseup="unpressKey()" @mousedown="pressKey(8)">8<div class="sub">TUV</div></button>
        <button class="key" @mouseup="unpressKey()" @mousedown="pressKey(9)">9<div class="sub">WXYZ</div></button>
        <button class="key" @mouseup="unpressKey()" @mousedown="pressKey('#')">#</button>
        <button class="key" @mouseup="unpressKey()" @mousedown="pressKey(0)">0<div class="sub">+</div></button>
        <button class="key" @mouseup="stopDunpressKeytmf()" @mousedown="pressKey('*')">*</button>
    </div>
</div>
