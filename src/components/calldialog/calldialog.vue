<div class="calldialog-component panel-content" :class="{'call-active': sip.session.state, 'no-call': !sip.session.state}">

    <!-- Call information during a call -->
    <div class="call-info" v-if="sip.session.state">
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
        <div class="option"  @click="toggleTransfer" :class="{'active': sip.session.transfer}">
            <div class="icon"><i class="fa fa-hand-scissors-o"></i></div>
            <p>transfer</p>
        </div>

        <div class="option" @click="toggleHold" :class="{'active': sip.session.hold}">
            <div class="icon"><i class="fa fa-inverse fa-pause"></i></div>
            <p>on-hold</p>
        </div>

        <div class="option" @click="toggleKeypad" :class="{'active': keypad}">
            <div class="icon"><i class="fa fa-th"></i></div>
            <p>keypad</p>
        </div>
    </div>

    <!-- In-call keypad -->
    <Keypad :model.sync="dtmfnumbers" :dtmf="true" :number="dtmfnumbers" v-if="keypad"></Keypad>
    <!-- Keypad as dialpad which sets the main number to be called -->
    <Keypad :model.sync="sip.number" :dtmf="false" :number="sip.number" v-if="!sip.session.state"></Keypad>

    <div class="call-actions">
        <!-- Decline/hangup button is visible during multiple states -->
        <div class="action decline" v-if="['accepted', 'create', 'invite'].includes(sip.session.state)">
            <span class="fa-stack fa-2x" @click="stopSession">
              <i class="fa fa-circle fa-stack-2x"></i>
              <i class="fa fa-close fa-stack-1x fa-inverse"></i>
            </span>
        </div>

        <!-- Pickup button is only visible when being called (invite) -->
        <div class="action accept" v-if="sip.session.state === 'invite'">
            <span class="fa-stack fa-2x" @click="acceptSession">
              <i class="fa fa-circle fa-stack-2x"></i>
              <i class="fa fa-phone fa-stack-1x fa-inverse"></i>
            </span>
        </div>
        <!-- Dial button only visible when not in a call yet -->
        <div class="action dial" v-if="!sip.session.state">
            <span class="fa-stack fa-2x" @click="dial(sip.number)">
              <i class="fa fa-circle fa-stack-2x"></i>
              <i class="fa fa-phone fa-stack-1x fa-inverse"></i>
            </span>
        </div>
    </div>

</div>
