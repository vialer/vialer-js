<div class="calldialog-component" :class="classes('component')">
    <!-- Call information during a call -->
    <div class="call-info" v-if="call.status && !keypad"">
        <div class="info-status">
            {{callStatus}}
        </div>
        <div class="info-number">{{call.number}}</div>
        <div class="info-name" v-if="sip.displayName">{{call.displayName}}</div>

        <!-- timer shown during the call -->
        <div class="info-timer" v-if="call.timer.start">
            {{sessionTime}}
        </div>
    </div>


    <!-- Call options during a call -->
    <div class="call-options" v-if="['accepted'].includes(call.status)">
        <div class="rounded-button-with-text">
            <div class="rounded-button"  @click="toggleTransfer" :class="{'active': transfer}">
                <i class="icon icon-merge_type"></i>
            </div>
            <p>transfer</p>
        </div>

        <div class="rounded-button-with-text">
            <div class="rounded-button" @click="toggleHold" :class="{'active': hold}">
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
    <Keypad :model.sync="dtmfnumbers" :dtmf="true" :number="dtmfnumbers" v-if="keypad" :class="{'call-active': call.status}"></Keypad>
    <!-- Keypad as dialpad which sets the main number to be called -->
    <Keypad :model.sync="number" :dtmf="false" :number="number" v-if="!call.status" :class="{'no-call': !call.status}"></Keypad>

    <div class="call-actions">

        <!-- Decline/hangup button is visible during multiple states -->
        <div class="rounded-button action decline" v-if="['accepted', 'create', 'invite'].includes(call.status)" @click="callTerminate(call)">
            <i class="icon icon-phone-hang-up"></i>
        </div>

        <!-- Pickup button is only visible when being called (invite) -->
        <div class="rounded-button action accept" v-if="call.status === 'invite'" @click="callAnswer(call)">
            <i class="icon icon-phone"></i>
        </div>

        <!-- Dial button only visible when not in a call yet -->
        <div class="rounded-button action dial" v-if="!call.status" @click="dial(number)" :class="{'disabled': !call.status}">
            <i class="icon icon-phone"></i>
        </div>
    </div>

</div>
