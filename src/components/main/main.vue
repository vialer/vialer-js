<component class="component-main" id="app">
    <!-- Force the telemetry window to show up -->
    <Wizard v-if="!wizard.completed && user.authenticated"/>
    <template v-else>
        <div class="overlay" v-if="overlay">
            <div class="close-button" @click="closeOverlay()">
                <icon name="close"/>
            </div>
            <About v-if="overlay==='about'"/>
        </div>

        <MainStatusBar v-if="!callOngoing"/>
        <MainCallBar v-if="callOngoing && call.active" :call="call" v-for="call in calls"/>

        <Notifications  :class="classes('notifications')"/>

        <div class="panel" :class="classes('panel')">

            <template v-if="!user.authenticated">
                <Login v-if="layer === 'login'" class="panel-content"/>
                <Unlock v-else-if="layer === 'unlock'" class="panel-content"/>
            </template>

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
    </template>
</component>
