<component class="component-settings">

    <div class="tabs">
        <ul>
            <li :class="classes('tabs', 'general')" @click="setTab('settings', 'general')">
                <a><span class="icon is-small"><icon name="user"/></span><span class="cf">{{$t('general')}}</span></a>
            </li>
            <li :class="classes('tabs', 'privacy')" @click="setTab('settings', 'privacy')">
                <a><span class="icon is-small"><icon name="lock-on"/></span><span class="cf">{{$t('privacy')}}</span></a>
            </li>
            <li :class="classes('tabs', 'phone')" @click="setTab('settings', 'phone')">
                <a><span class="icon is-small"><icon name="phone"/></span><span class="cf">{{$t('calling')}}</span></a>
            </li>
            <li :class="classes('tabs', 'audio')" @click="setTab('settings', 'audio', settings.webrtc.enabled)">
                <a><span class="icon is-small"><icon name="microphone"/></span><span>Audio</span></a>
            </li>
        </ul>
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

        <Field v-if="user.developer && settings.platform.enabled" name="platform_url" type="text"
            :label="$t('platform URL')"
            :model.sync="settings.platform.url"
            :help="$t('this URL is used to communicate with the platform API; don\'t change it unless you know what you\'re doing.')"
            :validation="$v.settings.platform.url"
            placeholder="https://"/>

        <Field v-if="user.developer || !settings.platform.enabled" name="sip_endpoint" type="text"
            :label="$t('webRTC endpoint')"
            :model.sync="settings.webrtc.endpoint.uri"
            :help="$t('domainname of the SIP server with websocket support.')"
            :placeholder="$t('SIP server')"
            :validation="$v.settings.webrtc.endpoint.uri"/>
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
            :help="$t('we solely collect anonymized data about usage statistics and application errors with the purpose to improve the {name} more efficiently.', {name: app.name})"/>
    </div>

    <!-- Phone preferences -->
    <div class="tab" :class="{'is-active': tabs.active === 'phone'}">

        <Field name="webrtc_enabled" type="checkbox"
            :disabled="env.isFirefox"
            :label="$t('use as softphone')"
            :model.sync="settings.webrtc.toggle"
            :help="env.isFirefox ? $t('firefox doesn\'t support this feature yet.') : $t('use WebRTC to receive incoming calls with and place outgoing calls.')"/>

        <AccountPicker :label="$t('softphone VoIP account')" :v="$v" v-if="user.platform.account.selection"/>
    </div>

    <!-- Audio settings -->
    <div class="tab" :class="{'is-active': tabs.active === 'audio'}">
        <DevicePicker v-if="settings.webrtc.media.permission"/>
        <div v-else>
            <MicPermission/>
        </div>
    </div>

    <div class="tabs-actions field is-grouped">
        <button class="button is-primary cf" :disabled="$v.$invalid" @click="save">{{$t('save changes')}}</button>
    </div>
</component>
