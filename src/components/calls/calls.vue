<component class="component-calls" :class="classes('component')">
    <!-- There should always be a call active when viewing this component. -->
    <template>
        <Call :call="activeCall" class="panel-content"/>
        <CallSwitch v-if="callOngoing" :call="activeCall"/>
    </template>
</component>
