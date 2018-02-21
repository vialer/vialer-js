<div class="call-keypad-component" tabindex="-1" :class="{'call-ongoing': callOngoing}">
    <div :class="classes('number-input')" v-if="display === 'dense'">
        <input type="text" ref="input" autofocus placeholder="..."
            @keyup="unpressKey()" @keydown="pressKey($event.key)"
            v-bind:value="number" v-on:input="inputChange($event.target.value)"
            v-on:keyup.enter="createCall(number)"/>

        <i class="icon icon-transfer" v-if="mode === 'call'" :class="{'disabled': !number}"
            v-on:keyup.enter="keypadAction" @click="createCall(number)"/>
    </div>
    <div :class="classes('number-input')" v-else-if="display === 'touch'">
        <input type="text" ref="input" autofocus placeholder="..."
            @keyup="unpressKey()" @keydown="pressKey($event.key)"
            v-bind:value="number" v-on:input="inputChange($event.target.value)"
            v-on:keyup.enter="createCall(number)"/>

        <i class="correct" v-if="mode === 'call'" @click="removeLastNumber"><svgicon name="correct"/></i>
    </div>

    <div class="contacts-match" v-if="mode === 'call'">
        <span v-if="matchedContact">{{matchedContact.number}} - {{matchedContact.name}}</span>
    </div>

    <div class="keys" v-if="display === 'touch'" v-on:keyup.enter="createCall(number)" :class="{disabled: callingDisabled}">
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
        <div class="rounded-button action dial" @click="createCall(number)" :class="{'disabled': !number || callingDisabled}">
            <svgicon name="phone"/>
        </div>
    </div>
</div>
