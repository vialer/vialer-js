<div class="calldialog-component panel-content" :class="{'no-state': !sip.session.state, 'state': sip.session.state}">

    <div class="call-info" v-if="sip.session.state">
        <div class="session-status">
            <span v-if="sip.session.state === 'create'">{{$t('Calling')}}</span>
            <span v-if="sip.session.state === 'invite'">{{$t('Incoming call')}}</span>
            <span v-if="sip.session.state === 'bye'">{{$t('Terminated')}}</span>
            <span v-if="sip.session.state === 'rejected'">{{$t('Declined')}}</span>
        </div>
        <div class="call-number">{{sip.number}}</div>
        <div class="call-name" v-if="sip.displayName">{{sip.displayName}}</div>
    </div>
    <div class="timer" v-if="timer">
        {{minutes | two_digits}}:{{seconds | two_digits}}
    </div>



    <div class="options" v-if="['accepted'].includes(sip.session.state)">
        <div class="option">
            <div class="icon">
                <i class="fa fa-hand-scissors-o"></i>
            </div>
            <p>transfer</p>
        </div>

        <div class="option" @click="toggleHold" :class="{'active': sip.session.hold}">
            <div class="icon">
                <i class="fa fa-inverse fa-pause"></i>
            </div>
            <p>on-hold</p>
        </div>

        <div class="option" @click="toggleKeypad" :class="{'active': keypad}">
            <div class="icon">
                <i class="fa fa-th"></i>
            </div>
            <p>keypad</p>
        </div>
    </div>

    <!-- in-call keypad -->
    <Keypad :model.sync="dtmfnumbers" :dtmf="true" :number="dtmfnumbers" v-if="keypad"></Keypad>
    <Keypad :model.sync="sip.number" :dtmf="false" :number="sip.number" v-if="!sip.session.state"></Keypad>

    <div class="actions">
        <div class="option" v-if="['accepted', 'create', 'invite'].includes(sip.session.state)">
            <span class="decline fa-stack fa-2x" @click="stopSession">
              <i class="fa fa-circle fa-stack-2x"></i>
              <i class="fa fa-close fa-stack-1x fa-inverse"></i>
            </span>
        </div>

        <!-- pickup is only done for callee -->
        <div class="option" v-if="sip.session.state === 'invite'">
            <span class="accept fa-stack fa-2x" @click="acceptSession">
              <i class="fa fa-circle fa-stack-2x"></i>
              <i class="fa fa-phone fa-stack-1x fa-inverse"></i>
            </span>
        </div>

        <div class="option" v-if="!sip.session.state">
            <span class="dial-button fa-stack fa-2x" @click="dial(sip.number)">
              <i class="fa fa-circle fa-stack-2x"></i>
              <i class="fa fa-phone fa-stack-1x fa-inverse"></i>
            </span>
        </div>

    </div>
</div>
