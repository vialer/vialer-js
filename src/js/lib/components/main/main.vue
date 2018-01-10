<div class="container" id="app">
    <template v-if="!$store.user.authenticated">
        <Navigation></Navigation>
        <Settings v-if="$store.ui.layer==='settings'"></Settings>
        <Login v-if="$store.ui.layer==='login'"></Login>
    </template>
    <template v-else>
        <Navigation></Navigation>

        <template v-if="$store.ui.layer==='app'">
            <Availability></Availability>
            <Contacts></Contacts>
            <Queues></Queues>
        </template>
        <template v-else-if="$store.ui.layer==='settings'">
            <Settings></Settings>
        </template>
        <template v-else-if="$store.ui.layer==='dialpad'">
            <Dialpad></Dialpad>
        </template>
        <template v-else-if="$store.ui.layer==='calling'">
            <div>OVERLAY</div>
        </template>
    </template>
</div>
