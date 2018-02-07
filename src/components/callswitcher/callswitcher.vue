<div class="callswitcher-component">
    <div class="call" v-for="call in calls">
        <i class="icon" :title="call.number" :class="classes(call, 'call-button')" @click="setActiveCall(call)"></i>
    </div>
    <div class="call">
        <i class="fa fa-plus" :title="$t('New call')" :class="classes(null, 'call-button-add')" @click="toggleNewCall"></i>
    </div>
</div>
