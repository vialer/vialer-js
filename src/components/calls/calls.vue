<component class="component-calls" :class="classes('component')">
    <!-- There should always be a call active when viewing this component. -->
    <template v-if="activeCall">
        <Call :call="activeCall" class="panel-content"/>
        <CallSwitch v-if="callOngoing" :call="activeCall"/>
    </template>
    <!-- Otherwise this is considered to be an error. -->
    <div class="no-call-error" v-else>
        Error 1: No Call objects activated
    </div>
</component>
