<div class="notifications-component">
    <span v-for="item in notifications" v-bind:key="notifications.indexOf(item)" class="notification" :class="classes('notification', item)">
        <div class="icon">
            <svgicon :name="item.icon" v-if="item.icon"/>
        </div>
        <div class="message" v-if="html" v-html="message"></div>
        <div class="message" v-else>{{item.message}}</div>
        <div class="actions">
            <button class="delete" @click="close(item)"></button>
        </div>
    </span>
</div>
