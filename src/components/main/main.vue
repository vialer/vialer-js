<div class="main-component" id="app">
    <!-- Force the telemetry window to show up -->
    <template v-if="telemetry.enabled === null">
        <Telemetry></Telemetry>
    </template>
    <template v-else>
        <MainStatusBar v-if="!callOngoing" />
        <MainCallBar v-if="callOngoing && call.active" :call="call" v-for="call in calls"/>

        <div class="panel">
            <div class="panel-content-container" v-if="!user.authenticated">
                <Notifications/>
                <Login v-if="layer==='login'" class="panel-content"/>
                <Settings v-if="layer==='settings'"/>
            </div>

            <template v-else>
                <MainMenuBar class="panel-sidebar"/>
                <Notifications class="with-sidebar"/>
                <Availability v-if="layer==='availability'" class="panel-content-container with-sidebar"/>
                <Contacts v-else-if="layer==='contacts'" class="panel-content-container with-sidebar"/>
                <Queues v-else-if="layer==='queues'" class="panel-content-container with-sidebar"/>
                <Settings v-else-if="layer==='settings'" class="panel-content-container with-sidebar"/>
                <Calls v-else-if="layer==='calls'" :calls="calls" class="panel-content-container with-sidebar"/>
            </template>
        </div>
    </template>
</div>
