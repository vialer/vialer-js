<component class="component-settings">

    <div class="tabs">
        <ul>
            <li :class="classes('tabs', 'general')" @click="setTab('settings', 'general')">
                <a><span class="icon is-small"><icon name="user"/></span><span>{{$t('General')}}</span></a>
            </li>
            <li :class="classes('tabs', 'privacy')" @click="setTab('settings', 'privacy')">
                <a><span class="icon is-small"><icon name="lock-on"/></span><span>{{$t('Privacy')}}</span></a>
            </li>
            <li :class="classes('tabs', 'phone')" @click="setTab('settings', 'phone')">
                <a><span class="icon is-small"><icon name="phone"/></span><span>{{$t('Calling')}}</span></a>
            </li>
            <li :class="classes('tabs', 'audio')" @click="setTab('settings', 'audio', settings.webrtc.enabled)">
                <a><span class="icon is-small"><icon name="microphone"/></span><span>{{$t('Audio')}}</span></a>
            </li>
        </ul>
    </div>

    <!-- General preferences -->
    <div class="tab" :class="{'is-active': tabs.active === 'general'}">

        <Field name="click2dial" type="checkbox"
            :help="$t('Add clickable icons next to phonenumbers in webpages.')"
            :label="`${$t('Click-to-Dial')} ${$t('icons')}`"
            :model.sync="settings.click2dial.enabled"
            :placeholder="$t('SIP Server')"/>

        <Field name="language" type="textarea" v-if="user.developer"
            :help="$t('The language used throughout the application.')"
            :label="`${$t('Click-to-Dial')} ${$t('blacklist')}`" :model.sync="settings.click2dial.blacklist"
            :placeholder="$t('Use one line per site.')"/>

        <Field name="language" type="select"
            :help="$t('The language used throughout the application.')"
            :label="$t('Application language')" :model.sync="settings.language.selected"
            :options="settings.language.options"
            :placeholder="$t('Select a language')"/>

        <Field name="platform_url" type="text" v-if="user.developer && settings.platform.enabled"
            :label="$t('Platform URL')" :model.sync="settings.platform.url"
            :help="$t('This URL is used to communicate with the platform API. Don\'t change it unless you know what you\'re doing.')"
            :validation="$v.settings.platform.url"
            placeholder="https://"/>

        <Field name="sip_endpoint" type="text" v-if="user.developer || !settings.platform.enabled"
            :label="$t('SIP server')" :model.sync="settings.sipEndpoint"
            :help="$t('Domainname of the SIP server with websocket support.')"
            :placeholder="$t('SIP server')"
            :validation="$v.settings.sipEndpoint"/>

        <Field name="platform_enabled" type="checkbox" v-if="vendor.type === 'open'"
            :label="`${vendor.name} ${$t('platform integration')}`" :model.sync="settings.platform.enabled"
            :help="$t('Add user availability, queues status monitoring and calling without WebRTC. A paid {vendor} account is required.', {vendor: vendor.name})"/>
    </div>

    <!-- Privacy settings -->
    <div class="tab" :class="{'is-active': tabs.active === 'privacy'}">

        <Field name="store_key" type="checkbox"
            :label="$t('Automatic unlock')" :model.sync="settings.vault.store"
            :help="$t('Automatically unlock after a browser restart.')"/>

        <div class="notification-box info" v-if="settings.vault.store">
            <header><icon name="lock-off"/><span>{{$t('Data security')}}</span></header>
            <ul>
                <li>{{$t('Your data and credentials are stored encrypted in the browser by a password-generated key.')}}
                    {{$t('This key is intentionally not stored anywhere, to make it unlikely that your credentials are looked at without knowing the password.')}}
                    {{$t('Make sure your computer is in a trusted environment before enabling this option.')}}
                </li>
            </ul>
        </div>

        <Field name="telemetry_enabled" type="checkbox"
            :label="$t('Telemetry')" :model.sync="settings.telemetry.enabled"
            :help="$t('Pseudo-anonymized usage statistics help us to improve the software.')"/>
    </div>

    <!-- Phone preferences -->
    <div class="tab" :class="{'is-active': tabs.active === 'phone'}">

        <Field name="webrtc_enabled" type="checkbox"
            :disabled="env.isFirefox"
            :label="$t('Use as softphone')"
            :model.sync="settings.webrtc.enabled"
            :help="env.isFirefox ? $t('Firefox doesn\'t support this feature yet.') : $t('Use WebRTC to be able to receive incoming calls with and place outgoing calls.')"/>

        <VoipaccountPicker :label="$t('Softphone VoIP-account')"/>
    </div>

    <!-- Audio settings -->
    <div class="tab" :class="{'is-active': tabs.active === 'audio'}">

        <Field name="input_device" type="select" v-if="settings.webrtc.media.permission"
            :label="$t('Headset microphone')" :model.sync="devices.input.selected"
            :options="devices.input.options"
            :placeholder="$t('Select an input device')"/>

        <MicPermission />

        <Field name="output_device" type="select" v-if="settings.webrtc.media.permission"
            :label="$t('Headset audio output')"
            :model.sync="devices.output.selected"
            :options="devices.output.options"
            :placeholder="$t('Select an output device')"/>

        <Field name="sounds_device" type="select" v-if="settings.webrtc.media.permission"
            :label="$t('Ringtone audio output')"
            :model.sync="devices.sounds.selected"
            :options="devices.sounds.options"
            :placeholder="$t('Select a sounds output device')"/>

        <div class="ringtone">
            <Field class="ringtone-select" name="ringtone" type="select"
                :label="`${$t('Ringtone audio')} ${$t('file')}`"
                :model.sync="settings.ringtones.selected"
                :options="settings.ringtones.options"
                :placeholder="$t('Select a ringtone')">

                <button slot="select-extra" class="ringtone-play button is-link select-button" :disabled="!sound.enabled" @click="playSound()">
                    <span class="icon is-small"><icon name="ring"/></span>
                </button>
            </Field>
        </div>

        <Field name="audio_codec" type="select" v-if="user.developer"
            :label="$t('Audio codec')" :model.sync="settings.webrtc.codecs.selected"
            :options="settings.webrtc.codecs.options"
            :placeholder="$t('Select an input device')"/>

        <Field name="media_type" type="select" v-if="user.developer"
            :help="$t('Media options that can be used by the browser.')"
            :label="$t('Supported media')" :model.sync="settings.webrtc.media.type.selected"
            :options="settings.webrtc.media.type.options"
            :placeholder="$t('Select an input device')"/>

    </div>

    <div class="tabs-actions field is-grouped">
        <button class="button is-primary" :disabled="$v.$invalid" @click="save">{{$t('Save changes')}}</button>
    </div>

</component>
