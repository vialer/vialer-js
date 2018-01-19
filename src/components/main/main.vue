<div id="app" class="main-component">

    <template v-if="!$store.user.authenticated">
        <Statusbar></Statusbar>
        <Settings v-if="$store.ui.layer==='settings'"></Settings>
        <Login v-if="$store.ui.layer==='login'"></Login>
    </template>

    <template v-else>
        <Statusbar></Statusbar>

        <div class="panel">
            <Sidebar class="panel-sidebar"></Sidebar>

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
            <template v-else-if="$store.ui.layer==='dialpad'">
                <CallDialog :keypad="$store.sip.session.state"></CallDialog>
            </template>
        </div>

    </template>
</div>
