<div class="call-switch-component">

    <!-- First loop through all the active calls -->
    <div class="call" v-if="call.status !== 'new'" v-for="call in calls">
        <i class="icon" :title="call.number" :class="classes(call, 'call-button')" @click="activateCall(call)"></i>
    </div>
    <!-- New call always end up at the bottom -->
    <div class="call" v-if="call.status === 'new'" v-for="call in calls">
        <i class="icon" :title="call.number" :class="classes(call, 'call-button')" @click="activateCall(call)"></i>
    </div>
    <div class="call" v-if="newCallAllowed()">
        <i class="add-call fa fa-plus" :title="$t('New call')" @click="createCall(false, false)"></i>
    </div>
</div>
