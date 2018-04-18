<component class="component-calls" :class="classes('component')">
    <!-- There should always be a call active when viewing this component. -->
    <div class="calls-container">
        <Call v-if="activeCall" :call="activeCall"/>
        <CallSwitch v-if="callOngoing" :call="activeCall"/>
    </div>
    <Soundmeter class="soundmeter" v-if="callOngoing"/>
</component>
