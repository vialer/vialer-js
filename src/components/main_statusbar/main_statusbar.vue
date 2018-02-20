<div class="main-statusbar-component">
    <div class="status-left" v-if="user.authenticated">
        <span class="status-indicator tooltip tooltip-right" :data-tooltip="titles('indicator')">

            <svgicon class="dnd" name="dnd" v-if="dnd"/>
            <svgicon class="disconnected" name="disconnected" v-else-if="ua.state === 'disconnected'"/>
            <svgicon class="registration-failed" name="disconnected" v-else-if="ua.state === 'registration_failed'"/>
            <svgicon class="connected" name="softphone" v-else-if="ua.state === 'connected'"/>
            <template v-else-if="ua.state === 'registered'">
                <svgicon class="registered" name="softphone" v-if="this.settings.webrtc.permission"/>
                <svgicon class="microphone-denied" name="mute" v-else></svgicon>
            </template>

        </span>

        <span class="username">{{user.username}}</span>

        <div class="options">
            <div class="option" @click=logout>
                <i class="icon-logout" :title="$t('Log out')"></i>
            </div>
        </div>
    </div>
    <div v-else class="vendor">
        <svgicon class="vendor-logo" name="logo"></svgicon>
        <span class="vendor-name">{{vendor.name}}</span>
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
