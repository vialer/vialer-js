<div class="options">

    <Field name="sip_endpoint" type="text"
        :label="$t('SIP Endpoint')" :model.sync="settings.sipEndpoint"
        :help="$t('The URL to the websocket SIP backend')"
        :placeholder="$t('SIP Server')"/>

    <Field name="webrtc_enabled" type="checkbox"
        :label="$t('Enable softphone')" :model.sync="settings.webrtc.enabled"
        :help="$t('Additional SIP register and audio over WebRTC')"/>

    <Field name="webrtc_username" type="text"
        :disabled="!settings.webrtc.enabled"
        :label="$t('Username')" :model.sync="settings.webrtc.username"
        :placeholder="$t('VoIP-account username')"/>

    <Field name="webrtc_password" type="password"
        :disabled="!settings.webrtc.enabled"
        :label="$t('Password')" :model.sync="settings.webrtc.password"
        :placeholder="$t('VoIP-account password')"/>

    <div class="field">
        <input id="platform_enabled" type="checkbox" v-model="settings.platform.enabled" />
        <label for="platform_enabled">{{$t('Enable platform features')}}</label>
    </div>

    <div class="field" v-if="settings.platform.enabled">
        <label for="platformUrl">{{$t('Platform URL')}}</label>
        <input id="platform-url" type="text" placeholder="https://" v-model="settings.platform.url" />
        <p class="warning platform-warning hide">{{$t('You will be automatically logged out when changing this setting')}}</p>
    </div>

    <div class="field">
        <input id="c2d" type="checkbox" v-model="settings.click2dial" />
        <label for="c2d">{{$t('Click-to-Dial icons in websites')}}</label>
    </div>

    <div class="field">
        <input id="telemetry_enabled" type="checkbox" v-model="settings.telemetry.enabled" />
        <label for="telemetry_enabled">{{$t('Enable telemetry')}}</label>
    </div>

    <div class="actions">
        <button id="save" type="button" @click="save">{{$t('Save')}}</button>
    </div>
</div>
