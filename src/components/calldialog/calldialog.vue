<div class="calldialog-component" :class="{'call-active': sip.session.state, 'no-call': !sip.session.state}">

    <!-- Call information during a call -->
    <div class="call-info" v-if="sip.session.state && !keypad"">
        <div class="info-status">
            {{callStatus}}
        </div>
        <div class="info-number">{{sip.number}}</div>
        <div class="info-name" v-if="sip.displayName">{{sip.displayName}}</div>

        <!-- timer shown during the call -->
        <div class="info-timer" v-if="sip.session.timer.start">
            {{sessionTime}}
        </div>
    </div>


    <!-- Call options during a call -->
    <div class="call-options" v-if="['accepted'].includes(sip.session.state)">
        <div class="rounded-button-with-text">
            <div class="rounded-button"  @click="toggleTransfer" :class="{'active': sip.session.transfer}">
                <i class="icon icon-merge_type"></i>
            </div>
            <p>transfer</p>
        </div>

        <div class="rounded-button-with-text">
            <div class="rounded-button" @click="toggleHold" :class="{'active': sip.session.hold}">
                <i class="icon icon-pause"></i>
            </div>
            <p>on-hold</p>
        </div>

        <div class="rounded-button-with-text">
            <div class="rounded-button" @click="toggleKeypad" :class="{'active': keypad}">
                <i class="icon icon-dialpad"></i>
            </div>
            <p>keypad</p>
        </div>
    </div>

    <!-- In-call keypad -->
    <Keypad :model.sync="dtmfnumbers" :dtmf="true" :number="dtmfnumbers" v-if="keypad" :class="{'call-active': sip.session.state}"></Keypad>
    <!-- Keypad as dialpad which sets the main number to be called -->
    <Keypad :model.sync="sip.number" :dtmf="false" :number="sip.number" v-if="!sip.session.state" :class="{'no-call': !sip.session.state}"></Keypad>

    <div class="call-actions">

        <!-- Decline/hangup button is visible during multiple states -->
        <div class="rounded-button action decline" v-if="['accepted', 'create', 'invite'].includes(sip.session.state)" @click="stopSession">
            <i class="icon icon-phone-hang-up"></i>
        </div>

        <!-- Pickup button is only visible when being called (invite) -->
        <div class="rounded-button action accept" v-if="sip.session.state === 'invite'" @click="acceptSession">
            <i class="icon icon-phone"></i>
        </div>

        <!-- Dial button only visible when not in a call yet -->
        <div class="rounded-button action dial" v-if="!sip.session.state" @click="dial(sip.number)" :class="{'disabled': !sip.number}">
            <i class="icon icon-phone"></i>
        </div>
    </div>

</div>
