<div class="statusbar-component" :class="{'call-active': sip.session.state}">
    <template v-if="!sip.session.state">
        <div class="username" v-if="user.authenticated">
            {{user.username}}
            <i class="icon-logout" :title="$t('Log out')" @click="logout()"></i>
        </div>

        <div class="options">
            <div class="option" :class="{active: layer === 'settings'}" @click="setLayer('settings')">
                 <i class="icon-settings"></i>
            </div>

            <div class="option" v-if="env.isExtension && $store.user.authenticated" @click="openPopoutView">
                <i class="icon-full-screen" :title="$t('Open in separate tab')"></i>
            </div>

            <div class="option" v-if="user.authenticated" @click="refreshApiData">
                <i class="icon-refresh" :title="$t('Refresh your data')"></i>
            </div>

            <div class="option" v-if="!user.authenticated">
                <i class="icon-logout" :title="$t('Login page')" :class="{active: layer === 'login'}" @click="setLayer('login')"></i>
            </div>

            <div class="option">
                <i class="icon-support" data-link="help" :title="$t('Help')" @click="openHelp"></i>
            </div>
        </div>
    </template>
    <template v-else>
        <div class="caller-info">
            <template v-if="sip.displayName">{{sip.displayName}}</template>
            <template v-else>{{sip.number}}</template>
        </div>

        <div class="call-info">
            <span class="status">{{callStatus}}</span>
            <span class="timer" v-if="sip.session.timer.start"> {{sessionTime}}</span>
        </div>

    </template>
</div>
