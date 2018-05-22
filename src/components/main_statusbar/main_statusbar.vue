<component class="component-main-statusbar" :class="classes('component')">

    <div v-if="!user.authenticated" class="vendor">
        <icon class="vendor-logo" name="logo"></icon>
        <span class="vendor-name">{{vendor.name}}</span>
    </div>
    <div class="status-left" v-else>
        <span class="status-indicator tooltip tooltip-right" :data-tooltip="titles('indicator')">

            <template v-if="settings.webrtc.enabled">
                <icon class="error" name="mute" v-if="!settings.webrtc.media.permission"/>
                <icon class="error" name="mute" v-else-if="!settings.webrtc.devices.ready"/>
                <icon class="error" name="softphone" v-else-if="ua.status !== 'registered'"/>
                <icon class="warning" name="dnd" v-else-if="dnd"/>
                <icon class="ok" name="softphone" v-else-if="ua.status === 'registered'"/>
            </template>
            <template v-else>
                <icon v-if="ua.status !== 'connected'" class="error" name="user" />
                <icon v-else class="ok" name="user" />
            </template>
        </span>

        <span class="username">{{user.username}}</span>

        <div class="options">
            <div class="option" @click="logout">
                <icon name="logout"/>
            </div>
        </div>
    </div>

    <div class="options">
        <!-- No real use in showing the popout view from an unauthenticated view -->
        <div class="option" v-if="env.isExtension && !env.isPopout && user.authenticated" @click="openPopoutView">
            <icon class="ext-tab" name="ext-tab"/>
        </div>

        <div class="option" v-if="user.authenticated" :class="{active: layer === 'settings'}" @click="setLayer('settings')">
            <icon class="settings" name="settings"/>
        </div>

        <div class="option" v-if="user.authenticated" :class="{disabled: !app.online}" @click="refreshApiData">
            <icon class="refresh" name="refresh"/>
        </div>

        <!-- Allow the user to bail out when it's unable to unlock-->
        <div class="option" @click="logout" v-else-if="layer === 'unlock'">
            <icon name="logout"/>
        </div>

        <div class="option" :class="{active: layer === 'about'}" @click="setOverlay('about')">
            <icon name="help"/>
        </div>
    </div>
</component>
