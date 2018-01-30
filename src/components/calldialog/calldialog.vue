<div class="calldialog-component" :class="classes('component')">
    <!-- Call information during a call -->
    <div class="call-info" v-if="!call.keypad.active">
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
                <i class="icon icon-merge_type"></i>
            </div>
            <p>{{$t('transfer')}}</p>
        </div>


        <div class="rounded-button-with-text">
            <div class="rounded-button" @click="holdToggle" :class="{'active': call.hold}">
                <i class="icon icon-pause"></i>
            </div>
            <p>{{$t('on-hold')}}</p>
        </div>

        <div class="rounded-button-with-text">
            <div class="rounded-button" @click="keypadToggle" :class="{'active': call.keypad.active, disabled: transferActive}">
                <i class="icon icon-dialpad"></i>
            </div>
            <p>{{$t('keypad')}}</p>
        </div>
    </div>

    <div class="transfer-options" v-if="call.transfer.active">
        <div class="transfer-buttons">
            <div class="transfer-button" :class="{'active': call.transfer.type === 'attended'}" @click="transferMode('attended')">
                {{$t('Attended transfer')}}
            </div>
            <div class="transfer-button" :class="{'active': call.transfer.type === 'blind'}" @click="transferMode('blind')">
                {{$t('Blind transfer')}}
            </div>
        </div>
        <div class="transfer-text">{{$t('To transfer select a contact or input a number.')}}</div>
        <Keypad :model.sync="call.keypad.number" :call="call" :dense="true" :number="call.keypad.number" class="transfer-keypad call-active"/>
    </div>

    <!-- For now, we use a dense keypad for transfer mode and a full keypad otherwise -->
    <Keypad v-if="call.keypad.active" :model.sync="call.keypad.number"
        :call="call" :number="call.keypad.number" :dtmf="true" class="call-active"/>

    <div class="call-actions">
        <div class="rounded-button action decline" v-if="!transferActive && ['accepted', 'create', 'invite'].includes(call.status) && !call.keypad.active" @click="callTerminate(call)">
            <i class="icon icon-phone-hang-up"></i>
        </div>

        <div class="rounded-button action accept" v-if="call.status === 'invite'" @click="callAnswer(call)">
            <i class="icon icon-phone"></i>
        </div>
    </div>
</div>
