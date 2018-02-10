<div class="calls-component" :class="{inactive: !callsActive}">
    <Call v-if="call.active" :call="call" v-for="call in calls" :key="call.id" class="panel-content"/>
    <CallSwitch v-if="callsActive" :call="call" v-for="call in calls" /> -
</div>
