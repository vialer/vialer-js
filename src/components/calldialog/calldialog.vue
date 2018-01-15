<div class="calldialog-component">

    <div class="number-display">{{sip.callerid}}</div>
    <div class="session-status">
        <span v-if="sip.session.state === 'create'">{{$t('Calling')}}</span>
        <span v-if="sip.session.state === 'invite'">{{$t('Incoming call')}}</span>
        <span v-if="sip.session.state === 'bye'">{{$t('Terminated')}}</span>
    </div>
    <div class="timer" v-if="timerStarted">
        {{minutes | two_digits}}:{{seconds | two_digits}}
    </div>

    <div class="options">
        <div class="option">
            <span class="decline fa-stack fa-3x">
              <i class="fa fa-circle fa-stack-2x"></i>
              <i class="fa fa-hand-scissors-o fa-stack-1x fa-inverse"></i>
            </span>
        </div>

        <div class="option">
            <span class="decline fa-stack fa-3x">
              <i class="fa fa-circle fa-stack-2x"></i>
              <i class="fa fa-pause fa-stack-1x fa-inverse"></i>
            </span>
        </div>

        <div class="option">
            <span class="decline fa-stack fa-3x">
              <i class="fa fa-circle fa-stack-2x"></i>
              <i class="fa fa-th fa-stack-1x fa-inverse"></i>
            </span>
        </div>
    </div>


    <div class="actions">
        <div class="field is-grouped is-grouped-centered" v-if="['accepted', 'create', 'invite'].includes(sip.session.state)">
            <p class="control">
                <span class="decline fa-stack fa-3x" @click="stopSession">
                  <i class="fa fa-circle fa-stack-2x"></i>
                  <i class="fa fa-close fa-stack-1x fa-inverse"></i>
                </span>
            </p>
        </div>

        <!-- pickup is only done for callee -->
        <div class="field is-grouped is-grouped-centered" v-if="sip.session.state === 'invite'">
            <p class="control">
                <span class="accept fa-stack fa-3x" @click="acceptSession">
                  <i class="fa fa-circle fa-stack-2x"></i>
                  <i class="fa fa-phone fa-stack-1x fa-inverse"></i>
                </span>
            </p>
        </div>
    </div>
</div>
