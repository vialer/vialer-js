<component class="component-calls" :class="classes('component')">
    <!-- There should always be a call active when viewing this component. -->
    <template>
        <Call v-if="activeCall" :call="activeCall" class="panel-content"/>
        <CallSwitch v-if="callOngoing" :call="activeCall"/>
    </template>
</component>
