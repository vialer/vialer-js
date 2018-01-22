<div id="app" class="main-component">
    <Statusbar></Statusbar>
    <Notifications :notifications="$store.notifications"></Notifications>

    <template v-if="!$store.user.authenticated">
        <Login v-if="$store.ui.layer==='login'"></Login>
    </template>

    <template v-else>
        <div class="panel">
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
        </div>

    </template>
</div>
