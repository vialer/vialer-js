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
            <div class="option" @click="logout">
                <svgicon name="logout"/>
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
            <svgicon class="ext-tab" name="ext-tab"/>
        </div>

        <div class="option" v-if="user.authenticated" :class="{active: layer === 'settings'}" @click="setLayer('settings')">
            <svgicon class="settings" name="settings"/>
        </div>

        <div class="option" v-if="user.authenticated" @click="refreshApiData">
            <svgicon class="refresh" name="refresh"/>
        </div>

        <div class="option" @click="openHelp">
            <svgicon name="help"/>
        </div>
    </div>
</div>
