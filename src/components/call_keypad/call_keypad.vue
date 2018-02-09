<div class="call-keypad-component" tabindex="-1">

    <div :class="classes('number-input')">
        <input type="text" ref="input" autofocus placeholder="..."
            @keyup="unpressKey()" @keydown="pressKey($event.key)"
            v-bind:value="number" v-on:input="inputChange($event.target.value)" v-on:keyup.enter="callStart(false)"/>
        <i class="icon icon-transfer" :class="{'disabled': !number}" v-if="display ==='dense' && mode === 'call'"
            v-on:keyup.enter="keypadAction" @click="callStart(true)"/>
        <i class="fa fa-angle-double-left" @click="removeLastNumber" v-if="display === 'touch' && mode === 'call'"/>
    </div>

    <div class="contacts-match" v-if="mode === 'call'">
        <span v-if="matchedContact">{{matchedContact.number}} - {{matchedContact.name}}</span>
    </div>

    <div class="keys" v-if="display === 'touch'" v-on:keyup.enter="callStart(false)">
        <div class="key-row">
            <button class="rounded-button key" @mouseup="unpressKey()" @mousedown="pressKey('1')">1</button>
            <button class="rounded-button key" @mouseup="unpressKey()" @mousedown="pressKey('2')">2<div class="sub">ABC</div></button>
            <button class="rounded-button key" @mouseup="unpressKey()" @mousedown="pressKey('3')">3<div class="sub">DEF</div></button>
        </div>
        <div class="key-row">
            <button class="rounded-button key" @mouseup="unpressKey()" @mousedown="pressKey('4')">4<div class="sub">GHI</div></button>
            <button class="rounded-button key" @mouseup="unpressKey()" @mousedown="pressKey('5')">5<div class="sub">JKL</div></button>
            <button class="rounded-button key" @mouseup="unpressKey()" @mousedown="pressKey('6')">6<div class="sub">MNO</div></button>
        </div>
        <div class="key-row">
            <button class="rounded-button key" @mouseup="unpressKey()" @mousedown="pressKey('7')">7<div class="sub">PQRS</div></button>
            <button class="rounded-button key" @mouseup="unpressKey()" @mousedown="pressKey('8')">8<div class="sub">TUV</div></button>
            <button class="rounded-button key" @mouseup="unpressKey()" @mousedown="pressKey('9')">9<div class="sub">WXYZ</div></button>
        </div>
        <div class="key-row">
            <button class="rounded-button key" @mouseup="unpressKey()" @mousedown="pressKey('*')">*</button>
            <button class="rounded-button key" @mouseup="unpressKey()" @mousedown="pressKey('0')">0<div class="sub">+</div></button>
            <button class="rounded-button key" @mouseup="unpressKey()" @mousedown="pressKey('#')">#</button>
        </div>
    </div>
    <!-- Dial actions when not used in combination with a call. -->
    <div class="call-actions touch" v-if="mode === 'call' && display === 'touch'">
        <div class="rounded-button action dial" @click="callStart(false)" :class="{'disabled': !number}">
            <i class="icon icon-phone"></i>
        </div>
    </div>
</div>
