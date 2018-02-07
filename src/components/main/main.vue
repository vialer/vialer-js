<div class="main-component" id="app">

    <StatusBar v-if="!Object.keys($store.calls.calls).length"/>
    <CallBar v-if="call.active" :call="call" v-for="call in $store.calls.calls"/>

    <div class="panel">
        <div class="panel-content-container" v-if="!$store.user.authenticated">
            <Notifications/>
            <Login v-if="$store.ui.layer==='login'" class="panel-content"/>
            <Settings v-if="$store.ui.layer==='settings'" class="panel-content"/>
        </div>

        <template v-if="$store.user.authenticated">
            <SideBar class="panel-sidebar"/>
            <Notifications class="with-sidebar"/>
            <Availability v-if="$store.ui.layer==='availability'" class="panel-content-container with-sidebar"/>
            <Contacts v-else-if="$store.ui.layer==='contacts'" class="panel-content-container with-sidebar"/>
            <Queues v-else-if="$store.ui.layer==='queues'" class="panel-content-container with-sidebar"/>
            <Settings v-else-if="$store.ui.layer==='settings'" class="panel-content-container with-sidebar"/>
            <Calls v-else-if="$store.ui.layer==='calls'" :calls="$store.calls.calls" class="panel-content-container with-sidebar"/>
        </template>
    </div>
</div>
