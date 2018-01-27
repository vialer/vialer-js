<div class="callbar-component">

    <div></div>

    <div class="in-call-info">
        <div class="caller-status">
            <template v-if="sip.displayName">{{sip.displayName}}</template>
            <template v-else>{{sip.number}}</template>
        </div>

        <div class="call-info">
            <span class="status">{{callStatus}}</span>
            <span class="timer" v-if="sip.session.timer.start"> {{sessionTime}}</span>
        </div>
    </div>
</div>
