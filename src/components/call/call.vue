<div class="call-component" :class="classes('component')">
    <!-- Call information during a call. Hide when the keypad takes too muchs space. -->
    <div class="call-info" v-if="(!call.keypad.active || call.keypad.display === 'dense') && !['new'].includes(call.status)">
        <div class="info-status">{{callStatus}}</div>
        <div class="info-number">{{call.number}}</div>
        <div class="info-name" v-if="call.displayName">{{call.displayName}}</div>
        <div class="info-timer" v-if="!['invite', 'create'].includes(call.status)">{{sessionTime}}</div>
    </div>

    <!-- Call options like transfer ops, on-hold and keypad -->
    <div class="call-options" v-if="['accepted'].includes(call.status)">
        <div class="rounded-button-with-text" v-if="call.transfer.type !== 'accept'">
            <div class="rounded-button" @click="transferToggle" :class="{'active': call.transfer.active}">
                <i class="icon icon-transfer"></i>
            </div>
            <p>{{$t('transfer')}}</p>
        </div>
        <div class="rounded-button-with-text" v-else>
            <div class="rounded-button" @click="transferFinalize">
                <i class="icon icon-merge"></i>
            </div>
            <p>{{$t('transfer')}}</p>
        </div>


        <div class="rounded-button-with-text">
            <div class="rounded-button" @click="holdToggle" :class="{'active': call.hold}">
                <i class="icon icon-on-hold"></i>
            </div>
            <p>{{$t('hold')}}</p>
        </div>

        <div class="rounded-button-with-text">
            <div class="rounded-button" @click="keypadToggle" :class="classes('dialpad-button')">
                <i class="icon icon-dialpad"></i>
            </div>
            <p>{{$t('keypad')}}</p>
        </div>
    </div>

    <!-- Show only when transfer is active and the call is still active -->
    <div class="transfer-options" v-if="call.transfer.active && ['accepted'].includes(call.status)">
        <div class="transfer-buttons">
            <div class="transfer-button" :class="classes('attended-button')" @click="transferMode('attended')">
                {{$t('Attended transfer')}}
            </div>
            <div class="transfer-button" :class="classes('blind-button')" @click="transferMode('blind')">
                {{$t('Blind transfer')}}
            </div>
        </div>
        <div class="transfer-text">{{$t('Select a recipient or enter a number to transfer.')}}</div>
        <CallKeypad :model.sync="call.keypad.number" display="dense" :call="call" mode="call" :number="call.keypad.number"/>
    </div>
    <!-- Show attended/blind transfer option and a dense keypad when transfer is active and the call is still active -->
    <div class="new-call" v-if="call.status === 'new' || call.keypad.active">
        <CallKeypad :model.sync="call.keypad.number" :call="call" :display="call.keypad.display"
            :mode="call.keypad.mode" :number="call.keypad.number"/>
    </div>

    <div class="call-actions">
        <div class="rounded-button action decline" v-if="!transferActive && ['accepted', 'create', 'invite'].includes(call.status) && !call.keypad.active"
            @click="callTerminate(call)">
            <i class="icon icon-hang-up"></i>
        </div>

        <div class="rounded-button action accept" v-if="call.status === 'invite'" @click="callAnswer(call)">
            <i class="icon icon-phone"></i>
        </div>
    </div>
</div>
