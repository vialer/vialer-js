<div class="main-component" id="app">
    <Notifications/>
    <StatusBar v-if="!Object.keys($store.sip.calls).length"/>
    <CallBar v-if="call.active" :call="call" v-for="call in $store.sip.calls"/>

    <div class="panel">
        <div class="panel-content-unauthenticated" v-if="!$store.user.authenticated">
            <Login v-if="$store.ui.layer==='login'"/>
            <Settings v-if="$store.ui.layer==='settings'"/>
        </div>

        <template v-if="$store.user.authenticated">
            <SideBar class="panel-sidebar"/>

            <div class="panel-content-container">
                <template v-if="$store.ui.layer==='availability'">
                    <Availability/>
                </template>

                <template v-else-if="$store.ui.layer==='contacts'">
                    <Contacts/>
                </template>

                <template v-else-if="$store.ui.layer==='queues'">
                    <Queues/>
                </template>

                <template v-else-if="$store.ui.layer==='settings'">
                    <Settings/>
                </template>

                <template v-else-if="$store.ui.layer==='calldialog'">
                    <CallDialog v-if="call.active" :call="call" v-for="call in $store.sip.calls" :key="call.id"/>
                    <!-- Keypad for dialing out is only visible when no calls are active yet -->
                    <Keypad :model.sync="$store.sip.number" :search="true" :number="$store.sip.number" v-if="!Object.keys($store.sip.calls).length" class="no-call"></Keypad>
                </template>
            </div>
            <CallSwitcher v-if="$store.ui.layer==='calldialog'"/>
        </template>
    </div>
</div>
