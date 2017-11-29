<div class="container" id="app">
    <template v-if="!$store.user.authenticated">
        <Login></Login>
    </template>
    <template v-else>
        <AccountInfo></AccountInfo>
        <Availability></Availability>
        <Contacts></Contacts>
        <Queues></Queues>
    </template>
</div>
