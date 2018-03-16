<component class="component-calls" :class="{'call-ongoing': callOngoing}">
    <Call v-if="call.active" :call="call" v-for="call in calls" :key="call.id" class="panel-content"/>
    <CallSwitch v-if="callOngoing" :call="call" v-for="call in calls" /> -
</component>
