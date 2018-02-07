<div class="calls-component">
    <CallDialog v-if="call.active" :call="call" v-for="call in calls" :key="call.id" class="panel-content"/>
    <CallSwitcher v-if="$store.ui.layer==='calls'"/> -
</div>
