<div class="container" id="app">
    <template v-if="$store.ui.layer==='app'">
        <template v-if="!$store.user.authenticated">
            <Login></Login>
        </template>
        <template v-else>
            <Navigation></Navigation>
            <Availability></Availability>
            <Contacts></Contacts>
            <Queues></Queues>
        </template>
    </template>
    <template v-else-if="$store.ui.layer==='settings'">
        <Navigation></Navigation>
        <Settings></Settings>
    </template>
    <template v-else-if="$store.ui.layer==='dialpad'">
        <Navigation></Navigation>
        <Dialpad></Dialpad>
    </template>
    <template v-else-if="$store.ui.layer==='calling'">
        <div>OVERLAY</div>
    </template>
</div>
