<div class="main-statusbar-component" :class="{dnd}">
    <div class="status-left" v-if="user.authenticated">
        <span class="status-indicator">
            <i class="icon" :class="classes('indicator')" :title="titles('indicator')"></i>
        </span>
        <span class="username">{{user.username}}</span>
        <div class="options">
            <div class="option" @click=logout>
                <i class="icon-logout" :title="$t('Log out')"></i>
            </div>
        </div>
    </div>
    <!-- Empty container is here to push .options to the right. -->
    <div v-else></div>
    <div class="options">
        <!-- No real use in showing the popout view from an unauthenticated view -->
        <div class="option" v-if="env.isExtension && !env.isPopout && user.authenticated" @click="openPopoutView">
            <i class="icon-ext-tab" :title="$t('Open in separate tab')"></i>
        </div>

        <div class="option" v-if="user.authenticated" :class="{active: layer === 'settings'}" @click="setLayer('settings')">
             <i class="icon-settings"></i>
        </div>

        <div class="option" v-if="user.authenticated" @click="refreshApiData">
            <i class="icon-refresh" :title="$t('Refresh your data')"></i>
        </div>

        <div class="option" @click="openHelp">
            <i class="icon-help" data-link="help" :title="$t('Help')"></i>
        </div>
    </div>
</div>
