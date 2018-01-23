<div id="app" class="main-component">
    <Statusbar></Statusbar>
    <Notifications :notifications="$store.notifications"></Notifications>

    <div class="panel">
        <div class="panel-content-unauthenticated" v-if="!$store.user.authenticated">
            <Login v-if="$store.ui.layer==='login'"></Login>
            <Settings v-if="$store.ui.layer==='settings'"></Settings>
        </div>

        <template v-if="$store.user.authenticated">
                <Sidebar class="panel-sidebar"></Sidebar>

                <div class="panel-content">
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
                        <CallDialog :keypad="$store.sip.session.state"></CallDialog>
                    </template>
                </div>
        </template>
    </div>
</div>
