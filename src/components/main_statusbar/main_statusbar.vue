<div class="main-statusbar-component" :class="{dnd}">
    <div class="status-left" v-if="user.authenticated">
        <span class="status-indicator">
            <i v-if="ua.state === 'disconnected'" class="icon icon-disconnected disconnected" :title="$t('Status:') + ' ' + $t('disconnected')"></i>
            <i v-if="ua.state === 'connected'" class="icon icon-vialer-icon connected" :title="$t('Status:') + ' ' +  $t('connected')"></i>
            <i v-if="ua.state === 'registered'" class="icon icon-vialer-icon registered" :title="$t('Status:') + ' ' + $t('registered')"></i>
            <i v-if="ua.state === 'registration_failed'" class="icon icon-disconnected registration-failed" :title="$t('Status:') + ' ' + $t('registration failed')"></i>
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
        <div class="option" v-if="!user.authenticated" :class="{active: layer === 'login'}" @click="setLayer('login')">
            <i class="icon-logout" :title="$t('Login page')"></i>
        </div>

        <div class="option" v-if="env.isExtension && !env.isPopout" @click="openPopoutView">
            <i class="icon-ext-tab" :title="$t('Open in separate tab')"></i>
        </div>

        <div class="option" :class="{active: layer === 'settings'}" @click="setLayer('settings')">
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
