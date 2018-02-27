<component class="component-call-switch">

    <!-- First loop through all the active calls -->
    <div :data-tooltip="callTitle(call)" class="call tooltip tooltip-left" :class="classes(call, 'call-button')"
        v-if="call.status !== 'new'" v-for="call in calls" @click="activateCall(call)">
        <svgicon :name="callIcon(call)"/>
    </div>
    <!-- New call always end up at the bottom -->
    <div :data-tooltip="callTitle(call)" class="call tooltip tooltip-left" :class="classes(call, 'call-button')"
        v-if="call.status === 'new'" v-for="call in calls" @click="activateCall(call)">
        <svgicon :name="callIcon(call)"/>
    </div>
    <div :data-tooltip="$t('Setup new Call')" class="call tooltip tooltip-left" v-if="newCallAllowed()" @click="createCall(false, false)">
        <svgicon name="dialpad"/>
    </div>
</component>
