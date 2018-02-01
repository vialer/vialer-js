<div class="callswitcher-component">
    <div class="call" v-for="call in calls">
        <i class="icon" :title="call.number" :class="classes(call, 'icon')" @click="setActiveCall(call)"></i>
    </div>
</div>
