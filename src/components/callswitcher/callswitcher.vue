<div class="callswitcher-component" :class="{inactive: !callsActive}">

    <!-- First loop through all the active calls -->
    <div class="call" v-if="call.status !== 'new'" v-for="call in calls">
        <i class="icon" :title="call.number" :class="classes(call, 'call-button')" @click="setActiveCall(call)"></i>
    </div>
    <!-- The new calls always end up at the bottom -->
    <div class="call" v-if="call.status === 'new'" v-for="call in calls">
        <i class="icon" :title="call.number" :class="classes(call, 'call-button')" @click="setActiveCall(call)"></i>
    </div>

    <div class="call" v-if="newCallAvailable()">
        <i class="fa fa-plus" :title="$t('New call')" :class="classes(null, 'call-button-add')" @click="toggleNewCall"></i>
    </div>
</div>
