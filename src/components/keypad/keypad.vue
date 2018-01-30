<div class="keypad-component">

    <div class="dense-number-input" v-if="dense">
        <input type="text" ref="input" autofocus placeholder="..."
            @keyup="unpressKey()" @keydown="pressKey($event.key)"
            v-bind:value="number" v-on:input="inputChange($event.target.value)"/>
        <i class="icon icon-transfer" @click="transferActivate(number)" :class="{'disabled': !number}"></i>
    </div>

    <div class="number-input" v-else>
        <input type="text" ref="input" autofocus placeholder="..."
            @keyup="unpressKey()" @keydown="pressKey($event.key)"
            v-bind:value="number" v-on:input="inputChange($event.target.value)"/>
        <i class="fa fa-angle-double-left" @click="removeLastNumber"></i>
    </div>

    <div class="number-input-match">
        <span v-if="matchedContact">
            {{matchedContact.internal_number}} - {{matchedContact.description}}
        </span>
    </div>

    <div class="keys" v-if="!dense">
        <div class="row">
            <button class="rounded-button key" @mouseup="unpressKey()" @mousedown="pressKey(1)">1</button>
            <button class="rounded-button key" @mouseup="unpressKey()" @mousedown="pressKey(2)">2<div class="sub">ABC</div></button>
            <button class="rounded-button key" @mouseup="unpressKey()" @mousedown="pressKey(3)">3<div class="sub">DEF</div></button>
        </div>
        <div class="row">
            <button class="rounded-button key" @mouseup="unpressKey()" @mousedown="pressKey(4)">4<div class="sub">GHI</div></button>
            <button class="rounded-button key" @mouseup="unpressKey()" @mousedown="pressKey(5)">5<div class="sub">JKL</div></button>
            <button class="rounded-button key" @mouseup="unpressKey()" @mousedown="pressKey(6)">6<div class="sub">MNO</div></button>
        </div>
        <div class="row">
            <button class="rounded-button key" @mouseup="unpressKey()" @mousedown="pressKey(7)">7<div class="sub">PQRS</div></button>
            <button class="rounded-button key" @mouseup="unpressKey()" @mousedown="pressKey(8)">8<div class="sub">TUV</div></button>
            <button class="rounded-button key" @mouseup="unpressKey()" @mousedown="pressKey(9)">9<div class="sub">WXYZ</div></button>
        </div>
        <div class="row">
            <button class="rounded-button key" @mouseup="unpressKey()" @mousedown="pressKey('#')">#</button>
            <button class="rounded-button key" @mouseup="unpressKey()" @mousedown="pressKey(0)">0<div class="sub">+</div></button>
            <button class="rounded-button key" @mouseup="stopDunpressKeytmf()" @mousedown="pressKey('*')">*</button>
        </div>
    </div>
    <!-- Dial actions when not used in combination with a call. -->
    <div class="call-actions" v-if="!call">
        <div class="rounded-button action dial" @click="dial" :class="{'disabled': !number}">
            <i class="icon icon-phone"></i>
        </div>
    </div>
</div>
