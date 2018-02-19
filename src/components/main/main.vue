<div class="main-component" id="app">
    <!-- Force the telemetry window to show up -->
    <template v-if="$store.settings.telemetry.enabled === null">
        <Telemetry></Telemetry>
    </template>
    <template v-else>
        <MainStatusBar v-if="!callOngoing" />
        <MainCallBar v-if="callOngoing && call.active" :call="call" v-for="call in $store.calls.calls"/>

        <div class="panel">
            <div class="panel-content-container" v-if="!$store.user.authenticated">
                <Notifications/>
                <Login v-if="$store.ui.layer==='login'" class="panel-content"/>
                <Settings v-if="$store.ui.layer==='settings'"/>
            </div>

            <template v-else>
                <MainMenuBar class="panel-sidebar"/>
                <Notifications class="with-sidebar"/>
                <Availability v-if="$store.ui.layer==='availability'" class="panel-content-container with-sidebar"/>
                <Contacts v-else-if="$store.ui.layer==='contacts'" class="panel-content-container with-sidebar"/>
                <Queues v-else-if="$store.ui.layer==='queues'" class="panel-content-container with-sidebar"/>
                <Settings v-else-if="$store.ui.layer==='settings'" class="panel-content-container with-sidebar"/>
                <Calls v-else-if="$store.ui.layer==='calls'" :calls="$store.calls.calls" class="panel-content-container with-sidebar"/>
            </template>
        </div>
    </template>
</div>
