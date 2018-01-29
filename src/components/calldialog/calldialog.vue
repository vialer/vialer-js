<div class="calldialog-component" :class="classes('component')">
    <!-- Call information during a call -->
    <div class="call-info">
        <div class="info-status">{{callStatus}}</div>
        <div class="info-number">{{call.number}}</div>
        <div class="info-name" v-if="call.displayName">{{call.displayName}}</div>
        <div class="info-timer" v-if="!['invite', 'create'].includes(call.status)">{{sessionTime}}</div>
    </div>


    <div class="call-options" v-if="['accepted'].includes(call.status)">
        <div class="rounded-button-with-text">
            <div class="rounded-button"  @click="toggleTransfer" :class="{'active': call.transfer.active}">
                <i class="icon icon-merge_type"></i>
            </div>
            <p>transfer</p>
        </div>

        <div class="rounded-button-with-text">
            <div class="rounded-button" @click="toggleHold" :class="{'active': call.hold}">
                <i class="icon icon-pause"></i>
            </div>
            <p>on-hold</p>
        </div>

        <div class="rounded-button-with-text">
            <div class="rounded-button" @click="toggleKeypad" :class="{'active': call.keypad.active}">
                <i class="icon icon-dialpad"></i>
            </div>
            <p>keypad</p>
        </div>
    </div>

    <div class="transfer-options" v-if="call.transfer.active">
        <div class="transfer-buttons">
            <div class="transfer-button" :class="{'active': call.transfer.type === 'attended'}" @click="setTransferMode('attended')">
                {{$t('Attended transfer')}}
            </div>
            <div class="transfer-button" :class="{'active': call.transfer.type === 'blind'}" @click="setTransferMode('blind')">
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
        <div class="rounded-button action decline" v-if="['accepted', 'create', 'invite'].includes(call.status)" @click="callTerminate(call)">
            <i class="icon icon-phone-hang-up"></i>
        </div>

        <div class="rounded-button action accept" v-if="call.status === 'invite'" @click="callAnswer(call)">
            <i class="icon icon-phone"></i>
        </div>
    </div>
</div>
