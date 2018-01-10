<div class="c-navigation">
    <span v-if="user.authenticated" class="user-name">{{user.username}}</span>
    <i v-if="user.authenticated" class="logout-button icon-logout" :title="$t('Log out')" @click="logout()"></i>

    <div class="items">
        <i v-if="user.authenticated" class="icon-full-screen" :title="$t('Open in separate tab')"></i>
        <i class="icon-support" data-link="help" :title="$t('Help')"></i>
        <i class="icon-refresh" :title="$t('Refresh your data')" v-if="user.authenticated"></i>
        <i class="icon-settings" :title="$t('Settings')" :class="{active: layer === 'settings'}"
            @click="setLayer('settings')">
        </i>
        <i v-if="user.authenticated" class="icon-bars" :title="$t('Colleagues, Queues and Availability')" :class="{active: layer === 'app'}" @click="setLayer('app')"></i>
        <i v-if="user.authenticated" class="icon-dialpad" :title="$t('Close')" :class="{active: layer === 'dialpad'}" @click="setLayer('dialpad')"></i>
        <i v-if="!user.authenticated" class="icon-logout" :title="$t('Open in separate tab')" :class="{active: layer === 'login'}" @click="setLayer('login')"></i>
    </div>
</div>
