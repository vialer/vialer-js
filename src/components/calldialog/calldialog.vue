<div class="calldialog-component">

    <div class="call-info" v-if="sip.session.state">
        <div class="call-name" v-if="sip.displayName">{{sip.displayName}}</div>
        <div class="call-number">{{sip.number}}</div>
    </div>
    <div class="timer" v-if="timer">
        {{minutes | two_digits}}:{{seconds | two_digits}}
    </div>

    <div class="session-status">
        <span v-if="sip.session.state === 'create'">{{$t('Calling')}}</span>
        <span v-if="sip.session.state === 'invite'">{{$t('Incoming call')}}</span>
        <span v-if="sip.session.state === 'bye'">{{$t('Terminated')}}</span>
        <span v-if="sip.session.state === 'rejected'">{{$t('Declined')}}</span>
    </div>

    <div class="options" v-if="['accepted'].includes(sip.session.state)">
        <div class="option">
            <span class="decline fa-stack fa-2x">
              <i class="fa fa-circle fa-stack-2x"></i>
              <i class="fa fa-hand-scissors-o fa-stack-1x fa-inverse"></i>
            </span>
        </div>

        <div class="option">
            <span class="decline fa-stack fa-2x" @click="toggleHold">
              <i class="fa fa-circle fa-stack-2x"></i>
              <i class="fa fa-stack-1x fa-inverse" :class="{'fa-pause': !sip.hold, 'fa-play': sip.hold}"></i>
            </span>
        </div>

        <div class="option">
            <span class="decline fa-stack fa-2x" @click="toggleKeypad">
              <i class="fa fa-circle fa-stack-2x"></i>
              <i class="fa fa-th fa-stack-1x fa-inverse"></i>
            </span>
        </div>
    </div>

    <Keypad :model.sync="sip.number" :number="sip.number" v-if="keypad"></Keypad>


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

        <div class="option" v-if="keypad && !sip.session.state">
            <span class="dial-button fa-stack fa-2x" @click="dial(sip.number)">
              <i class="fa fa-circle fa-stack-2x"></i>
              <i class="fa fa-phone fa-stack-1x fa-inverse"></i>
            </span>
        </div>

    </div>
</div>
