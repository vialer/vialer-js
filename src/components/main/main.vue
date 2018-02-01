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

            <div class="panel-content-container with-sidebar">
                <Notifications class="with-sidebar"/>
                <Availability v-if="$store.ui.layer==='availability'"/>
                <Contacts v-else-if="$store.ui.layer==='contacts'"/>
                <Queues v-else-if="$store.ui.layer==='queues'"/>
                <Settings v-else-if="$store.ui.layer==='settings'" class="panel-content"/>
                <template v-else-if="$store.ui.layer==='calldialog'">
                    <CallDialog v-if="call.active" :call="call" v-for="call in $store.calls.calls" :key="call.id" class="panel-content"/>
                    <!-- Keypad for dialing out is only visible when no calls are active yet -->
                    <Keypad :model.sync="$store.calls.number" :search="true" :number="$store.calls.number" v-if="!Object.keys($store.calls.calls).length" class="panel-content no-call"/>
                </template>
            </div>

            <CallSwitcher v-if="$store.ui.layer==='calldialog'"/>
        </template>
    </div>
</div>
