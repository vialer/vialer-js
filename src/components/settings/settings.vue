<div class="options">

    <div class="field">
        <label class="label">{{$t('SIP Endpoint')}}</label>
        <div class="control has-icons-left has-icons-right">
            <input class="input is-success" type="text" placeholder="SIP Server" v-model="settings.sipEndpoint">
            <span class="icon is-small is-left">
                <i class="fa fa-user"></i>
            </span>
            <span class="icon is-small is-right">
                <i class="fa fa-check"></i>
            </span>
        </div>
    </div>


    <div class="field">
        <input id="webrtc_enabled" type="checkbox" v-model="settings.webrtc.enabled" />
        <label for="webrtc_enabled">{{$t('Enable WebRTC')}}</label>
    </div>

    <div class="field" v-if="settings.webrtc.enabled">
        <label for="webrtc_enabled">{{$t('WebRTC VoIP account')}}</label>
        <input type="text" placeholder="VoIP account name" v-model="settings.webrtc.username" />
        <input type="password" placeholder="VoIP account password" v-model="settings.webrtc.password" />
    </div>

    <div class="field">

    </div>

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
