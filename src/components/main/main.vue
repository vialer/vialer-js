<component class="component-main" id="app">
    <!-- Force the telemetry window to show up -->
    <Notifications :class="classes('notifications')"/>

    <div class="overlay" v-if="overlay">
        <div class="close-button" @click="closeOverlay()">
            <icon name="close"/>
        </div>
        <component v-bind:is="overlay"/>
    </div>

    <Login v-if="!user.authenticated"/>
    <Wizard v-else-if="!wizard.completed && user.authenticated"/>
    <div v-else class="app-view">
        <MainStatusBar v-if="!callOngoing" class="app-view-top"/>

        <template v-for="call in calls">
            <MainCallBar v-if="callOngoing && call.active" :call="call" class="app-view-top"/>
        </template>

        <div class="app-view-main">
            <MainMenuBar class="app-view-sidebar"/>
            <!-- Dynamic component rendered based on layer name. -->
            <component v-bind:is="layer" class="app-view-layer"/>
        </div>
    </div>
</component>