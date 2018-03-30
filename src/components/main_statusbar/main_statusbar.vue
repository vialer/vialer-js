<component class="component-main-statusbar">

    <div v-if="!user.authenticated" class="vendor">
        <svgicon class="vendor-logo" name="logo"></svgicon>
        <span class="vendor-name">{{vendor.name}}</span>
    </div>
    <div class="status-left" v-else>
        <span class="status-indicator tooltip tooltip-right" :data-tooltip="titles('indicator')">
            <svgicon class="disconnected" name="disconnected" v-if="ua.status === 'disconnected'"/>
            <svgicon class="registration-failed" name="disconnected" v-else-if="ua.status === 'registration_failed'"/>
            <svgicon class="connected" name="user" v-else-if="ua.status === 'connected'"/>
            <template v-else-if="ua.status === 'registered'">
                <svgicon class="microphone-denied" name="mute" v-if="!this.settings.webrtc.media.permission"/>
                <svgicon class="dnd" name="dnd" v-else-if="dnd"/>
                <svgicon class="registered" name="softphone" v-else/>
            </template>
        </span>

        <span class="username">{{user.username}}</span>

        <div class="options">
            <div class="option" @click="logout">
                <svgicon name="logout"/>
            </div>
        </div>
    </div>

    <div class="options">
        <!-- No real use in showing the popout view from an unauthenticated view -->
        <div class="option" v-if="env.isExtension && !env.isPopout && user.authenticated" @click="openPopoutView">
            <svgicon class="ext-tab" name="ext-tab"/>
        </div>

        <div class="option" v-if="user.authenticated" :class="{active: layer === 'settings'}" @click="setLayer('settings')">
            <svgicon class="settings" name="settings"/>
        </div>

        <div class="option" v-if="user.authenticated" :class="{disabled: !app.online}" @click="refreshApiData">
            <svgicon class="refresh" name="refresh"/>
        </div>

        <!-- Allow the user to bail out when it's unable to unlock-->
        <div class="option" @click="logout" v-else-if="layer === 'unlock'">
            <svgicon name="logout"/>
        </div>

        <div class="option" :class="{active: layer === 'about'}" @click="setOverlay('about')">
            <svgicon name="help"/>
        </div>
    </div>
</component>
