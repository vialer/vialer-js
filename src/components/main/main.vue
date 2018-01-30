<div class="main-component" id="app">
    <Notifications></Notifications>
    <StatusBar v-if="!Object.keys($store.sip.calls).length"></StatusBar>
    <CallBar v-if="call.active" :call="call" v-for="call in $store.sip.calls"></Callbar>

    <div class="panel">
        <div class="panel-content-unauthenticated" v-if="!$store.user.authenticated">
            <Login v-if="$store.ui.layer==='login'"></Login>
            <Settings v-if="$store.ui.layer==='settings'"></Settings>
        </div>

        <template v-if="$store.user.authenticated">
            <SideBar class="panel-sidebar"></SideBar>

            <div class="panel-content-container">
                <template v-if="$store.ui.layer==='availability'">
                    <Availability></Availability>
                </template>

                <template v-else-if="$store.ui.layer==='contacts'">
                    <Contacts></Contacts>
                </template>

                <template v-else-if="$store.ui.layer==='queues'">
                    <Queues></Queues>
                </template>

                <template v-else-if="$store.ui.layer==='settings'">
                    <Settings></Settings>
                </template>

                <template v-else-if="$store.ui.layer==='calldialog'">
                    <CallDialog v-if="call.active" :call="call" v-for="call in $store.sip.calls" :key="call.id"></CallDialog>
                    <!-- Keypad for dialing out is only visible when no calls are active yet -->
                    <Keypad :model.sync="$store.sip.number" :number="$store.sip.number" v-if="!Object.keys($store.sip.calls).length" class="no-call"></Keypad>
                </template>
            </div>
            <CallSwitcher></CallSwitcher>
        </template>
    </div>
</div>
