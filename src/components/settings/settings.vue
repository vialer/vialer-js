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
            :label="$t('SIP server')"
            :model.sync="settings.sipEndpoint"
            :help="$t('domainname of the SIP server with websocket support.')"
            :placeholder="$t('SIP server')"
            :validation="$v.settings.sipEndpoint"/>

        <Field v-if="vendor.type === 'open'" name="platform_enabled" type="checkbox"
            :label="`${vendor.name} ${$t('platform integration')}`"
            :model.sync="settings.platform.enabled"
            :help="$t('add user availability, queues status monitoring and calling without WebRTC. A paid {vendor} account is required.', {vendor: vendor.name})"/>
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
            :help="$t('by collecting information about anonymized usage and errors, we are able to improve this software at a faster pace.')"/>
    </div>

    <!-- Phone preferences -->
    <div class="tab" :class="{'is-active': tabs.active === 'phone'}">
        <Field name="webrtc_enabled" type="checkbox"
            :disabled="env.isFirefox || !settings.webrtc.account.options.length"
            :label="$t('use as softphone')"
            :model.sync="settings.webrtc.enabled"
            :help="env.isFirefox ? $t('firefox doesn\'t support this feature yet.') : $t('use WebRTC to receive incoming calls with and place outgoing calls.')"/>

        <VoipaccountPicker :label="$t('softphone VoIP account')" :v="$v"/>
    </div>

    <!-- Audio settings -->
    <div class="tab" :class="{'is-active': tabs.active === 'audio'}">

        <Field v-if="settings.webrtc.media.permission" name="input_device" type="select"
            :label="$t('headset audio input')"
            :model.sync="devices.sinks.headsetInput"
            :options="devices.input"
            :validation="$v.settings.webrtc.devices.sinks.headsetInput.valid">
            <MicPermission slot="select-extra" v-if="$v.settings.webrtc.devices.sinks.headsetInput.valid.customValid"/>
        </Field>

        <Field v-if="settings.webrtc.media.permission" name="output_device" type="select"
            :help="$v.settings.webrtc.devices.sinks.headsetOutput.valid.customValid ? $t('does the audio play on the preferred device?') : ''"
            :label="$t('headset audio output')"
            :model.sync="devices.sinks.headsetOutput"
            :options="devices.output"
            :validation="$v.settings.webrtc.devices.sinks.headsetOutput.valid">
            <button slot="select-extra" class="ringtone-play button is-link select-button"
                :disabled="playing.headsetOutput" @click="playSound('busyTone', 'headsetOutput')">
                <span class="icon is-small"><icon name="ring"/></span>
            </button>
        </Field>

        <Field v-if="settings.webrtc.media.permission" name="sounds_device" type="select"
            :help="$v.settings.webrtc.devices.sinks.ringOutput.valid.customValid ? $t('does the audio play on the preferred device?') : ''"
            :label="`${$t('ringtone audio')} ${$t('output')}`"
            :model.sync="devices.sinks.ringOutput"
            :options="devices.output"
            :validation="$v.settings.webrtc.devices.sinks.ringOutput.valid">

            <button slot="select-extra" class="ringtone-play button is-link select-button"
                :disabled="playing.ringOutput" @click="playSound('ringTone', 'ringOutput')">
                <span class="icon is-small"><icon name="ring"/></span>
            </button>
        </Field>

        <Field v-if="user.developer" class="ringtone-select" name="ringtone" type="select"
            :label="$t('ringtone audiofile')"
            :model.sync="ringtones.selected"
            :options="ringtones.options">

            <button slot="select-extra" class="ringtone-play button is-link select-button"
                :disabled="playing.ringOutput" @click="playSound('ringTone', 'ringOutput')">
                <span class="icon is-small"><icon name="ring"/></span>
            </button>
        </Field>

        <Field v-if="user.developer" name="audio_codec" type="select"
            :label="$t('audio codec')"
            :model.sync="settings.webrtc.codecs.selected"
            :options="settings.webrtc.codecs.options"/>

        <Field v-if="user.developer" name="media_type" type="select"
            :help="$t('media options that can be used by the browser.')"
            :label="$t('supported media')"
            :model.sync="settings.webrtc.media.type.selected"
            :options="settings.webrtc.media.type.options"/>
    </div>

    <div class="tabs-actions field is-grouped">
        <button class="button is-primary cf" :disabled="$v.$invalid" @click="save">{{$t('save changes')}}</button>
    </div>
</component>
