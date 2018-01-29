<div class="main-component" id="app">
    <Notifications></Notifications>
    <Statusbar v-if="!$store.sip.calls.length"></Statusbar>
    <Callbar></Callbar>

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

                <template v-else-if="$store.ui.layer==='calldialog'" v-for="call in $store.sip.calls">

                    <CallDialog :call="call"></CallDialog>
                </template>
                <Keypad :model.sync="dtmfnumbers" :number="dtmfnumbers" v-if="!$store.sip.calls.length"></Keypad>
            </div>
        </template>
    </div>
</div>
