<div class="notifications-component">
    <div v-for="notification in notifications" class="notification" :class="classes('notification', notification)">
        <div class="icon">
            <i class="fa" :class="classes('icon', notification)" v-if="notification.icon"></i>
        </div>
        <div class="message" v-if="html" v-html="message"></div>
        <div class="message" v-else>
            {{ notification.message }}
        </div>
        <div class="actions">
            <button class="delete" @click="close(notification)"></button>
        </div>
    </div>
</div>
