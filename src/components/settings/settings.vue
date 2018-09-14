<component class="component-settings">

    <div class="tabs">
        <ul>
            <li :class="classes('tabs', 'phone')" @click="setTab('settings', 'phone')">
                <a><span class="icon is-small"><icon name="phone"/></span><span class="cf">{{$t('calling')}}</span></a>
            </li>
            <li :class="classes('tabs', 'devices')" @click="setTab('settings', 'devices', settings.webrtc.enabled)">
                <a><span class="icon is-small"><icon name="microphone"/></span><span class="cf">{{$t('devices')}}</span></a>
            </li>
            <li :class="classes('tabs', 'privacy')" @click="setTab('settings', 'privacy')">
                <a><span class="icon is-small"><icon name="lock-on"/></span><span class="cf">{{$t('privacy')}}</span></a>
            </li>
            <li :class="classes('tabs', 'general')" @click="setTab('settings', 'general')">
                <a><span class="icon is-small"><icon name="user"/></span><span class="cf">{{$t('general')}}</span></a>
            </li>
        </ul>
    </div>

    <!-- Phone preferences -->
    <div class="tab tab-phone" :class="{'is-active': tabs.active === 'phone'}">

        <Field name="webrtc_enabled" type="checkbox"
            v-if="settings.webrtc.account.selection"
            :disabled="env.isFirefox"
            :label="$t('use as softphone')"
            :model.sync="settings.webrtc.toggle"
            :help="env.isFirefox ? $t('firefox doesn\'t support this feature yet.') : $t('use WebRTC to receive incoming calls with and place outgoing calls.')"/>

        <AccountPicker :label="$t('softphone account')" :v="$v" v-if="settings.webrtc.account.selection"/>

        <Field name="audio_post_processing" type="select"
            :disabled="!settings.webrtc.toggle"
            :help="$t('use WebRTC audio post-processor for: echo cancelling, audio mirroring, auto-gain control, high-pass filter, noise suppression and typing noise detection.')"
            :label="$t('audio post-processing')"
            :model.sync="settings.webrtc.media.type.selected"
            :options="settings.webrtc.media.type.options"/>

    </div>

    <!-- Device settings -->
    <div class="tab" :class="{'is-active': tabs.active === 'devices'}">
        <DevicePicker v-if="settings.webrtc.media.permission"/>
        <MicPermission v-else/>
    </div>

    <!-- Privacy settings -->
    <div class="tab" :class="{'is-active': tabs.active === 'privacy'}">

        <Field name="store_key" type="checkbox"
            :label="$t('remember session')"
            :model.sync="app.vault.store"
            :help="$t('automatically unlock your session after restart.')">
        </Field>

        <Field name="telemetry_enabled" type="checkbox"
            :label="$t('telemetry')"
            :model.sync="settings.telemetry.enabled"
            :help="$t('we are able to improve the {name} faster, when you allow us to process anonymized data about usage statistics and application errors for analysis.', {name: app.name})"/>
    </div>

    <!-- General preferences -->
    <div class="tab" :class="{'is-active': tabs.active === 'general'}">

        <Field name="click2dial" type="checkbox"
            :help="$t('add clickable icons next to phonenumbers in webpages.')"
            :label="`${$t('click-to-Dial')} ${$t('icons')}`"
            :model.sync="settings.click2dial.enabled"/>

        <Field name="language" type="select"
            :help="$t('language used throughout the application.')"
            :label="$t('application language')"
            :model.sync="settings.language.selected"
            :options="settings.language.options"
            :placeholder="$t('select a language')"/>

        <Field v-if="user.developer" name="language" type="textarea"
            :help="$t('blacklist sites that don\'t work well with Click-to-dial icons.')"
            :label="`${$t('click-to-Dial')} ${$t('blacklist')}`"
            :model.sync="settings.click2dial.blacklist"
            :placeholder="$t('use one line per site.')"/>

        <Field v-if="user.developer" name="platform_url" type="text"
            :label="$t('platform URL')"
            :model.sync="settings.platform.url"
            :help="$t('this URL is used to communicate with the platform API; don\'t change it unless you know what you\'re doing.')"
            :validation="$v.settings.platform.url"
            placeholder="https://"/>

        <Field v-if="user.developer" name="sip_endpoint" type="text"
            :label="$t('webRTC endpoint')"
            :model.sync="settings.webrtc.endpoint.uri"
            :help="$t('domainname of the SIP server with websocket support.')"
            :placeholder="$t('SIP server')"
            :validation="$v.settings.webrtc.endpoint.uri"/>
    </div>

    <div class="tabs-actions field is-grouped">
        <button class="button is-primary cf" :disabled="$v.$invalid" @click="save">{{$t('save changes')}}</button>
    </div>
</component>
