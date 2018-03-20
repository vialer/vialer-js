<component class="component-main" id="app">
    <!-- Force the telemetry window to show up -->
    <template v-if="telemetry.enabled === null && user.authenticated">
        <Telemetry></Telemetry>
    </template>
    <template v-else>
        <MainStatusBar v-if="!callOngoing"/>
        <MainCallBar v-if="callOngoing && call.active" :call="call" v-for="call in calls"/>

        <Notifications  :class="classes('notifications')"/>
        <div class="panel" :class="classes('panel')">
            <template v-if="layer === 'login' || layer === 'unlock'">
                <Login v-if="layer === 'login'" class="panel-content"/>
                <Unlock v-else-if="layer === 'unlock'" class="panel-content"d/>
            </template>

            <template v-else>
                <MainMenuBar/>

                <Availability v-if="layer==='availability'"/>
                <Contacts v-else-if="layer==='contacts'"/>
                <Queues v-else-if="layer==='queues'"/>
                <Settings v-else-if="layer==='settings'"/>
                <Calls v-else-if="layer==='calls'"/>
            </template>
        </div>
    </template>
</component>
