<div id="app" class="main-component">

    <template v-if="!$store.user.authenticated">
        <Navigation></Navigation>
        <Settings v-if="$store.ui.layer==='settings'"></Settings>
        <Login v-if="$store.ui.layer==='login'"></Login>
    </template>

    <template v-else>
        <Navigation></Navigation>

        <div class="panel">
            <Sidebar></Sidebar>

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
