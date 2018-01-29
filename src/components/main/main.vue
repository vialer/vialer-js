<div class="main-component" id="app">
    <Notifications></Notifications>
    <Statusbar v-if="!Object.keys($store.sip.calls).length"></Statusbar>
    <!-- <Callbar v-if="$store.sip.call.active" :call="$store.sip.calls[$store.sip.call.active]"></Callbar> -->

    <div class="panel">
        <div class="panel-content-unauthenticated" v-if="!$store.user.authenticated">
            <Login v-if="$store.ui.layer==='login'"></Login>
            <Settings v-if="$store.ui.layer==='settings'"></Settings>
        </div>

        <template v-if="$store.user.authenticated">
            <Sidebar class="panel-sidebar"></Sidebar>

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

                <template v-else-if="$store.ui.layer==='calldialog'" >
                    <CallDialog v-if="$store.sip.call.active === call.id" :call="call" v-for="call in $store.sip.calls" :key="call.id"></CallDialog>
                    <!-- Keypad for dialing out is only visible when no calls are active yet -->
                    <Keypad :model.sync="dtmfnumbers" :number="dtmfnumbers" v-if="!Object.keys($store.sip.calls).length"></Keypad>
                </template>
            </div>
        </template>
    </div>
</div>
