<component class="component-main-callbar" :class="{inactive: call.status === 'new'}">
    <div></div>
    <div class="in-call-info">
        <div class="caller-status" v-if="call.status === 'new'">
            {{call.keypad.number}}
        </div>
        <div class="caller-status" v-else>
            <template v-if="call.displayName">{{call.displayName}}</template>
            <template v-else>{{call.number}}</template>
        </div>
        <div class="call-info" v-if="call.status === 'new'">
            <span class="status cf">{{$t('new call')}}</span>
            <span class="timer"></span>
        </div>
        <div class="call-info" v-else>
            <span class="status">{{callStatus}}</span>
            <span class="timer" v-if="call.timer.start"> {{sessionTime}}</span>
        </div>
    </div>
</component>
