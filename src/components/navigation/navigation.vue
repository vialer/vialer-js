<div class="navigation-component">
    <div v-if="user.authenticated" class="user-name">
        {{user.username}}
        <i v-if="user.authenticated" class="icon-logout" :title="$t('Log out')" @click="logout()"></i>
    </div>

    <div class="options">
        <div class="option">
            <i class="icon-support" data-link="help" :title="$t('Help')"></i>
        </div>

        <div class="option">
            <i class="icon-refresh" :title="$t('Refresh your data')" v-if="user.authenticated"></i>
        </div>

        <div class="option">
            <i v-if="user.authenticated" class="icon-full-screen" :title="$t('Open in separate tab')"></i>
        </div>

        <div class="option" :class="{active: layer === 'settings'}" @click="setLayer('settings')" v-if="!user.authenticated">
             <i class="fa fa-cog"></i>
        </div>

        <div class="option">
            <i v-if="!user.authenticated" class="icon-logout" :title="$t('Open in separate tab')" :class="{active: layer === 'login'}" @click="setLayer('login')"></i>
        </div>
    </div>
</div>
