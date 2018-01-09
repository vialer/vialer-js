<div class="c-navigation">
    <span class="user-name">{{user.username}}</span>
    <i class="logout-button icon-logout" :title="$t('Log out')" @click="logout()"></i>

    <div class="items">
        <i class="icon-full-screen" :title="$t('Open in separate tab')"></i>
        <i class="icon-support" data-link="help" :title="$t('Help')"></i>
        <i class="icon-refresh" :title="$t('Refresh your data')"></i>
        <i class="icon-settings" :title="$t('Settings')" :class="{active: layer === 'settings'}" @click="setLayer('settings')"></i>
        <i class="icon-bars" :title="$t('Colleagues, Queues and Availability')" :class="{active: layer === 'app'}" @click="setLayer('app')"></i>
        <i class="icon-dialpad" :title="$t('Close')" :class="{active: layer === 'dialpad'}" @click="setLayer('dialpad')"></i>
    </div>
</div>
