<component class="component-call-switch">

    <!-- First loop through all the active calls -->
    <div v-if="call.status !== 'new'" :data-tooltip="callTitle(call)" class="call tooltip tooltip-left" :class="classes(call, 'call-button')"
        v-for="call in calls" @click="activateOrDeleteCall(call)">
        <icon :name="callIcon(call)"/>
    </div>

    <!-- New call always end up at the bottom, but only if we are already in an accepted call. -->
    <div v-if="callAccepted && call.status === 'new'" :data-tooltip="callTitle(call)" class="call tooltip tooltip-left" :class="classes(call, 'call-button')"
        v-for="call in calls" @click="activateOrDeleteCall(call)">
        <icon :name="callIcon(call)"/>
    </div>

    <!-- Create new Call button is visible when there are no new calls yet and we are not in an accepted call. -->
    <div :data-tooltip="$t('setup new call').capitalize()" class="call new-call tooltip tooltip-left" v-if="callAccepted && newCallAllowed()" @click="createCall(false, false)">
        <icon name="dialpad"/>
    </div>

</component>
