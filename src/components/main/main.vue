<div id="app">
    <template v-if="!$store.user.authenticated">
        <Navigation></Navigation>
        <Settings v-if="$store.ui.layer==='settings'"></Settings>
        <Login v-if="$store.ui.layer==='login'"></Login>
    </template>
    <template v-else>
        <template v-if="$store.sip.session.state">
            <CallDialog></CallDialog>
        </template>
        <template v-else-if="$store.ui.layer==='app'">
            <Navigation></Navigation>
            <Availability></Availability>
            <Contacts></Contacts>
            <Queues></Queues>
        </template>
        <template v-else-if="$store.ui.layer==='settings'">
            <Navigation></Navigation>
            <Settings></Settings>
        </template>
        <template v-else-if="$store.ui.layer==='dialpad'">
            <Navigation></Navigation>
            <Dialpad></Dialpad>
        </template>

    </template>
</div>
