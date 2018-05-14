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

        <Field name="language" type="select"
            :label="$t('application language')"
            :model.sync="settings.language.selected"
            :options="settings.language.options"
            :placeholder="$t('select a language')"/>

        <Field name="click2dial" type="checkbox"
            :help="$t('add clickable icons next to phonenumbers in webpages.')"
            :label="`${$t('click-to-Dial')} ${$t('icons')}`"
            :model.sync="settings.click2dial.enabled"/>

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
            <div slot="checkbox-extra" v-if="app.vault.store" class="notification-box info">
                <header><icon name="info"/><span class="cf">{{$t('about data security')}}</span></header>
                <ul>
                    <li>
                        <span class="cf">{{$t('your data and credentials are stored encrypted in the browser by a password-generated key.')}}</span>
                        <span class="cf">{{$t('make sure your computer is in a trusted environment before enabling this option.')}}</span>
                    </li>
                </ul>
            </div>
        </Field>

        <Field name="telemetry_enabled" type="checkbox"
            :label="$t('telemetry')"
            :model.sync="settings.telemetry.enabled"
            :help="$t('by collecting information about anonymized usage and errors, we are able to improve this software at a faster pace.')"/>
    </div>

    <!-- Phone preferences -->
    <div class="tab" :class="{'is-active': tabs.active === 'phone'}">

        <Field name="webrtc_enabled" type="checkbox"
            :disabled="env.isFirefox"
            :label="$t('use as softphone')"
            :model.sync="settings.webrtc.enabled"
            :help="env.isFirefox ? $t('firefox doesn\'t support this feature yet.') : $t('use WebRTC to receive incoming calls with and place outgoing calls.')"/>

        <VoipaccountPicker :label="$t('softphone VoIP account')" :v="$v"/>
    </div>

    <!-- Audio settings -->
    <div class="tab" :class="{'is-active': tabs.active === 'audio'}">

        <Field v-if="settings.webrtc.media.permission" name="input_device" type="select"
            :label="$t('headset microphone')"
            :model.sync="devices.input.selected"
            :options="devices.input.options"
            :placeholder="$t('select an input device')">
            <MicPermission slot="select-extra"/>
        </Field>

        <Field v-if="settings.webrtc.media.permission" name="output_device" type="select"
            :label="$t('headset audio output')"
            :model.sync="devices.output.selected"
            :options="devices.output.options"
            :placeholder="$t('select an output device')"/>

        <Field v-if="settings.webrtc.media.permission" name="sounds_device" type="select"
            :label="`${$t('ringtone audio')} ${$t('output')}`"
            :model.sync="devices.sounds.selected"
            :options="devices.sounds.options"
            :placeholder="$t('select a output device for sounds')"/>

        <div class="ringtone">
            <Field class="ringtone-select" name="ringtone" type="select"
                :label="`${$t('ringtone audio')} ${$t('file')}`"
                :model.sync="settings.ringtones.selected"
                :options="settings.ringtones.options"
                :placeholder="$t('select a ringtone')">

                <button slot="select-extra" class="ringtone-play button is-link select-button"
                    :disabled="!sound.enabled" @click="playSound()">
                    <span class="icon is-small"><icon name="ring"/></span>
                </button>
            </Field>
        </div>

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
