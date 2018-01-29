<div class="calldialog-component" :class="classes('component')">
    <!-- Call information during a call -->
    <div class="call-info" v-if="call.status"">
        <div class="info-status">
            {{callStatus}}
        </div>
        <div class="info-number">{{call.number}}</div>
        <div class="info-name" v-if="call.displayName">{{call.displayName}}</div>

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
    <Keypad :model.sync="number" :dtmf="false" v-if="!call.status" :class="{'no-call': !call.status}"></Keypad>

    <div class="call-actions">
        <!-- Decline/hangup button is visible during multiple states -->
        <div class="rounded-button action decline" v-if="['accepted', 'create', 'invite'].includes(call.status)" @click="callTerminate(call)">
            <i class="icon icon-phone-hang-up"></i>
        </div>

        <!-- Pickup button when being called (invite) -->
        <div class="rounded-button action accept" v-if="call.status === 'invite'" @click="callAnswer(call)">
            <i class="icon icon-phone"></i>
        </div>
    </div>
</div>
