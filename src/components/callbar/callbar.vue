<div class="callbar-component">
    <div></div>

    <div class="in-call-info">
        <div class="caller-status">
            <template v-if="call.displayName">{{call.displayName}}</template>
            <template v-else>{{call.number}}</template>
        </div>

        <div class="call-info">
            <span class="status">{{callStatus}}</span>
            <span class="timer" v-if="call.timer.start"> {{sessionTime}}</span>
        </div>
    </div>
</div>
