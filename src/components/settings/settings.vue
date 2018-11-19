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

        <CheckboxField name="webrtc_enabled"
            v-if="settings.webrtc.account.selection"
            :disabled="env.isFirefox"
            :label="$t('use as softphone')"
            v-model="settings.webrtc.toggle"
            :help="env.isFirefox ? $t('firefox doesn\'t support this feature yet.') : $t('use WebRTC to receive incoming calls with and place outgoing calls.')" />

        <AccountPicker :label="$t('softphone account')" :v="$v" v-if="settings.webrtc.account.selection"/>

        <SelectField name="audio_post_processing"
            :disabled="!settings.webrtc.toggle"
            :help="$t('use WebRTC audio post-processor for: echo cancelling, audio mirroring, auto-gain control, high-pass filter, noise suppression and typing noise detection.')"
            :label="$t('audio post-processing')"
            v-model="settings.webrtc.media.type.selected"
            :options="settings.webrtc.media.type.options" />

    </div>

    <!-- Device settings -->
    <div class="tab" :class="{'is-active': tabs.active === 'devices'}">
        <DevicePicker v-if="settings.webrtc.media.permission"/>
        <MicPermission v-else/>
    </div>

    <!-- Privacy settings -->
    <div class="tab" :class="{'is-active': tabs.active === 'privacy'}">

        <CheckboxField name="store_key"
            :label="$t('remember session')"
            v-model="app.vault.store"
            :help="$t('automatically unlock your session after restart.')" />

        <CheckboxField name="telemetry_enabled"
            :label="$t('telemetry')"
            v-model="settings.telemetry.enabled"
            :help="$t('we are able to improve the {name} faster, when you allow us to process anonymized data about usage statistics and application errors for analysis.', {name: app.name})" />
    </div>

    <!-- General preferences -->
    <div class="tab" :class="{'is-active': tabs.active === 'general'}">

        <CheckboxField name="click2dial"
            :help="$t('add clickable icons next to phonenumbers in webpages.')"
            :label="`${$t('click-to-Dial')} ${$t('icons')}`"
            v-model="settings.click2dial.enabled" />

        <SelectField name="language"
            :help="$t('language used throughout the application.')"
            :label="$t('application language')"
            v-model="settings.language.selected"
            :options="settings.language.options"
            :placeholder="$t('select a language')" />

        <TextAreaField v-if="user.developer" name="language"
            :help="$t('blacklist sites that don\'t work well with Click-to-dial icons.')"
            :label="`${$t('click-to-Dial')} ${$t('blacklist')}`"
            v-model="settings.click2dial.blacklist"
            :placeholder="$t('use one line per site.')" />

        <TextField v-if="user.developer" name="platform_url"
            :label="$t('platform URL')"
            v-model="settings.platform.url"
            :help="$t('this URL is used to communicate with the platform API; don\'t change it unless you know what you\'re doing.')"
            :validation="$v.settings.platform.url"
            @input="$v.settings.platform.url.$touch()"
            placeholder="https://"/>

        <TextField v-if="user.developer" name="sip_endpoint"
            :label="$t('webRTC endpoint')"
            v-model="settings.webrtc.endpoint.uri"
            :help="$t('domainname of the SIP server with websocket support.')"
            :placeholder="$t('SIP server')"
            :validation="$v.settings.webrtc.endpoint.uri"
            @input="$v.settings.webrtc.endpoint.uri.$touch()" />
    </div>

    <div class="tabs-actions field is-grouped">
        <button class="button is-primary cf" :disabled="$v.$invalid" @click="save">{{$t('save changes')}}</button>
    </div>
</component>
