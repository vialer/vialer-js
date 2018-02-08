<div class="callbar-component" :class="{inactive: call.status === 'new'}">
    <div></div>
    <div class="in-call-info">
        <div class="caller-status">
            <template v-if="call.displayName">{{call.displayName}}</template>
            <template v-else>{{call.number}}</template>
        </div>

        <div class="call-info" v-if="call.status !== 'new'">
            <span class="status">{{callStatus}}</span>
            <span class="timer" v-if="call.timer.start"> {{sessionTime}}</span>
        </div>
        <div class="call-info" v-else>
            <span class="status">{{$t('New call')}}</span>
            <span class="timer"></span>
        </div>
    </div>
</div>
