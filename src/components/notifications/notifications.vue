<component class="component-notifications">
    <span v-for="item in notifications" v-bind:key="notifications.indexOf(item)" class="notification" :class="classes('notification', item)">
        <div class="icon">
            <icon :name="item.icon" v-if="item.icon"/>
        </div>
        <div class="message cf" v-if="html" v-html="message"></div>
        <div class="message cf" v-else>{{item.message}}</div>
        <div class="actions">
            <button class="delete test-delete" @click="close(item)"></button>
        </div>
    </span>
</component>
