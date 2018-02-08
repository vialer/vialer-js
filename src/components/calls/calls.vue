<div class="calls-component" :class="{inactive: !callsActive}">
    <CallDialog v-if="call.active" :call="call" v-for="call in calls" :key="call.id" class="panel-content"/>
    <CallSwitcher v-if="call.active" :call="call" v-for="call in calls" /> -
</div>
