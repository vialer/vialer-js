<div class="statusbar-component" :class="{'call-active': sip.session.state}">
    <!-- Statusbar when not in a call -->

    <div class="status-left" v-if="user.authenticated">
        <span class="status-indicator">
            <i v-if="sip.ua.state === 'disconnected'" class="fa fa-plug" :title="$t('Status:') + ' ' + $t('disconnected')"></i>
            <i v-if="sip.ua.state === 'connected'" class="fa fa-chain" :title="$t('Status:') + ' ' +  $t('connected')"></i>
            <i v-if="sip.ua.state === 'registered'" class="fa fa-exchange" :title="$t('Status:') + ' ' + $t('registered')"></i>
            <i v-if="sip.ua.state === 'registration_failed'" class="fa fa-chain-broken" :title="$t('Status:') + ' ' + $t('registration failed')"></i>
        </span>
        <span class="username" v-if="!sip.session.state">{{user.username}}</span>
        <div class="options" v-if="!sip.session.state">
            <div class="option">
                <i class="icon-logout" :title="$t('Log out')" @click="logout()"></i>
            </div>
        </div>
    </div>
    <div v-else></div>

    <div class="options" v-if="!sip.session.state">
        <div class="option" v-if="!user.authenticated" :class="{active: layer === 'login'}" @click="setLayer('login')">
            <i class="icon-logout" :title="$t('Login page')"></i>
        </div>

        <div class="option" v-if="env.isExtension && !env.isPopout" @click="openPopoutView">
            <i class="icon-full-screen" :title="$t('Open in separate tab')"></i>
        </div>

        <div class="option" :class="{active: layer === 'settings'}" @click="setLayer('settings')">
             <i class="icon-settings"></i>
        </div>

        <div class="option" v-if="user.authenticated" @click="refreshApiData">
            <i class="icon-refresh" :title="$t('Refresh your data')"></i>
        </div>

        <div class="option">
            <i class="icon-support" data-link="help" :title="$t('Help')" @click="openHelp"></i>
        </div>
    </div>

    <!-- Statusbar when in a call -->
    <div class="in-call-info" v-else>
        <div class="caller-status">
            <template v-if="sip.displayName">{{sip.displayName}}</template>
            <template v-else>{{sip.number}}</template>
        </div>

        <div class="call-info">
            <span class="status">{{callStatus}}</span>
            <span class="timer" v-if="sip.session.timer.start"> {{sessionTime}}</span>
        </div>
    </div>
</div>
