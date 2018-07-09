<component class="component-main" id="app">
    <!-- Force the telemetry window to show up -->
    <Notifications :class="classes('notifications')"/>
    <Wizard v-if="!wizard.completed && user.authenticated"/>
    <div v-else>
        <div class="overlay" v-if="overlay">
            <div class="close-button" @click="closeOverlay()">
                <icon name="close"/>
            </div>
            <About v-if="overlay==='about'"/>
        </div>

        <MainStatusBar v-if="!callOngoing"/>
        <MainCallBar v-if="callOngoing && call.active" :call="call" v-for="call in calls"/>

        <div class="panel" :class="classes('panel')">
            <Login v-if="!user.authenticated" class="panel-content"/>
            <template v-else>
                <MainMenuBar/>
                <Availability v-if="layer==='availability'"/>
                <Contacts v-else-if="layer==='contacts'"/>
                <Queues v-else-if="layer==='queues'"/>
                <Settings v-else-if="layer==='settings'"/>
                <Calls v-else-if="layer==='calls'"/>
                <Activity v-else-if="layer==='activity'"/>
            </template>
        </div>
    </div>
</component>
