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

        <Field name="language" type="select"
            :help="$t('The language used throughout the application.')"
            :label="$t('Application language')" :model.sync="settings.language.selected"
            :options="settings.language.options"
            :placeholder="$t('Select a language')"/>

        <Field name="click2dial" type="checkbox"
            :label="$t('Click-to-Dial icons')" :model.sync="settings.click2dial.enabled"
            :help="$t('Add clickable icons next to phonenumbers in webpages.')"
            :placeholder="$t('SIP Server')"/>

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
            :label="$t('Use as softphone')" :model.sync="settings.webrtc.enabled"
            :help="env.isFirefox ? $t('Firefox doesn\'t support this feature yet.') : $t('Use WebRTC to be able to receive incoming calls with and place outgoing calls.')"/>

        <!-- Platform integration allows the user to select a voip-account. -->
        <template v-if="['closed', 'open'].includes(app.vendor.type)">
            <Field name="webrtc_account" type="select"
                :disabled="!settings.webrtc.enabled"
                :empty="$t('No VoIP-accounts')"
                :label="$t('Softphone VoIP-account')" :model.sync="settings.webrtc.account.selected"
                :options="settings.webrtc.account.options"
                :placeholder="$t('Select a VoIP-account')"
                :validation="$v.settings.webrtc.account.selected.id"/>

            <div class="notification-box info" v-if="!settings.webrtc.account.options || !settings.webrtc.account.options.length">
                <header><icon name="info"/><span>{{$t('A VoIP-account is required.')}}</span></header>
                <ul>
                    <li>{{$t('Head over to')}} <a @click="openPlatformUrl(`user/${user.id}/change/#tc0=user-tab-2`)">{{$t('user preferences')}}</a> {{ $t('to manage your {target}', {target: `${vendor.name} ${$t('user')}`}) }}.</li>
                    <li>{{$t('Head over to')}} <a @click="openPlatformUrl(`phoneaccount`)">{{$t('VoIP-accounts')}}</a> {{ $t('to create a VoIP-account.') }}.</li>
                </ul>
            </div>
            <div class="notification-box troubleshoot" v-else-if="settings.webrtc.enabled">
                <header>
                    <icon name="info"/><span>{{`${$t('VoIP account')} ${$t('checklist')}`}}</span>
                </header>
                <ul>
                    <!-- Reference to the popout mode from the popup modus only-->
                    <li>{{$t('Make sure')}} <b><a @click="openPlatformUrl(`phoneaccount`)">{{$t('the account')}}</a></b> {{$t('is not in use by another device')}}.</li>
                    <li>{{$t('Make sure')}} <b><a @click="openPlatformUrl(`phoneaccount/${settings.webrtc.account.selected.id}/change/#tc0=tab-2`)">avpf=yes</a></b> {{$t('is set in Expert options')}}.</li>
                    <li>{{$t('Make sure')}} <b><a @click="openPlatformUrl(`phoneaccount/${settings.webrtc.account.selected.id}/change/#tc0=tab-2`)">{{$t('Enforce encryption')}}</a></b> {{$t('is set in Expert options')}}.</li>
                </ul>
            </div>
        </template>

        <template v-else-if="settings.webrtc.enabled && app.vendor.type === 'free'">
            <Field name="webrtc_username" type="text"
                :disabled="!settings.webrtc.enabled"
                :label="$t('VoIP') + ' ' + $t('username')" :model.sync="settings.webrtc.account.selected.username"
                :placeholder="$t('VoIP account') + ' id'"/>

            <Field name="webrtc_password" type="password"
                :disabled="!settings.webrtc.enabled"
                :label="$t('VoIP') + ' ' + $t('password')" :model.sync="settings.webrtc.account.selected.password"
                :placeholder="$t('VoIP account') + ' ' + $t('password')"/>
        </template>
    </div>

    <!-- Audio settings -->
    <div class="tab" :class="{'is-active': tabs.active === 'audio'}">

        <div class="ringtone">
            <Field class="ringtone-select" name="ringtone" type="select"
                :help="$t('The ringtone that is played when you\'re being called.')"
                :label="$t('Ringtone')" :model.sync="settings.ringtones.selected"
                :options="settings.ringtones.options"
                :placeholder="$t('Select a ringtone')">

                <button slot="select-extra" class="ringtone-play button is-link select-button" :disabled="!sound.enabled" @click="playSound()">
                    <span class="icon is-small"><icon name="ring"/></span>
                </button>
            </Field>
        </div>

        <Field name="media_type" type="select"
            :help="$t('Media options that can be used by the browser.')"
            :label="$t('Supported media')" :model.sync="settings.webrtc.media.type.selected"
            :options="settings.webrtc.media.type.options"
            :placeholder="$t('Select an input device')"/>

        <Field name="audio_codec" type="select"
            :label="$t('Audio codec')" :model.sync="settings.webrtc.codecs.selected"
            :options="settings.webrtc.codecs.options"
            :placeholder="$t('Select an input device')"/>

        <!-- Microphone permission switch -->
        <Field name="webrtc_permission" type="checkbox" :disabled="true" class="webrtc-switch"
            :label="$t('Microphone access')" :model.sync="settings.webrtc.media.permission" />

        <div class="field">
            <!-- Additional help to guide the user to the browser permission settings. -->
            <em class="help" v-if="settings.webrtc.media.permission">
                {{$t('Check if the volume meter responds to your voice.')}}
                <Soundmeter/>
            </em>
            <!-- Give the user instructions how to enable the microphone in the popout -->
            <div class="notification-box troubleshoot" v-else-if="!settings.webrtc.media.permission && env.isPopout">
                <header>
                    <icon name="warning"/><span>{{$t('The softphone doesn\'t have access to your microphone!')}}</span>
                </header>
                <ul>
                    <!-- Reference to the popout mode from the popup modus only-->
                    <li >
                        {{$t('Inspect the browser navigation bar for microphone access.')}}
                        <icon name="video-cam-disabled" class="video-cam-disabled"/>
                    </li>
                    <li>
                        {{$t('Refresh or close this tab afterwards to reflect your changes.')}}
                    </li>
                </ul>
            </div>

            <a class="microphone-popout button is-danger" v-if="!settings.webrtc.media.permission && !env.isPopout" @click="openPopoutView">
                <span class="icon is-small">
                    <icon name="microphone"/>
                </span>
                <span>{{$t('Allow microphone permission')}}</span>
            </a>
            <em class="help" v-if="!settings.webrtc.media.permission && !env.isPopout">
                {{$t('The softphone doesn\'t have access to your microphone!')}}
            </em>
        </div>


        <Field name="input_device" type="select" v-if="user.developer"
            :label="$t('Input device')" :model.sync="settings.webrtc.sinks.input"
            :options="inputDevice.options"
            :placeholder="$t('Select an input device')"/>

        <Field name="output_device" type="select" v-if="user.developer"
            :label="$t('Output device')" :model.sync="settings.webrtc.sinks.output"
            :options="outputDevice.options"
            :placeholder="$t('Select an output device')"/>
    </div>

    <div class="tabs-actions field is-grouped">
        <button class="button is-primary" :disabled="$v.$invalid" @click="save">{{$t('Save changes')}}</button>
    </div>

</component>
