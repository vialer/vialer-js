<div class="calls-component" :class="{inactive: !callsOngoing}">
    <Call v-if="call.active" :call="call" v-for="call in calls" :key="call.id" class="panel-content"/>
    <CallSwitch v-if="callsOngoing" :call="call" v-for="call in calls" /> -
</div>
