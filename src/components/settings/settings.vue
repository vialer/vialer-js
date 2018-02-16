<div class="settings-component">

    <div class="tabs">
        <ul>
            <li :class="{'is-active': tabs.active === 'general'}" @click="setTab('general')">
                <a><span class="icon is-small"><i class="fa fa-user"></i></span><span>{{$t('General')}}</span></a>
            </li>
            <li :class="{'is-active': tabs.active === 'audio'}" @click="setTab('audio')">
                <a><span class="icon is-small"><i class="fa fa-headphones"></i></span><span>Audio</span></a>
            </li>
            <li :class="{'is-active': tabs.active === 'phone'}" @click="setTab('phone')">
                <a><span class="icon is-small"><i class="fa fa-phone"></i></span><span>{{$t('Phone')}}</span></a>
            </li>
        </ul>
    </div>


    <!-- User preferences -->
    <div class="tab" :class="{'is-active': tabs.active === 'general'}">
        <Field name="language" type="select"
            :label="$t('Language')" :model.sync="settings.language.selected"
            :help="$t('Language to use within the app.')"
            :options="settings.language.options"
            :placeholder="$t('Select a language')"/>

        <Field name="click2dial" type="checkbox"
            :label="$t('Click-to-Dial icons')" :model.sync="settings.click2dial.enabled"
            :help="$t('Add clickable icons next to phonenumbers in webpages.')"
            :placeholder="$t('SIP Server')"/>

        <Field name="platform_enabled" type="checkbox"
            :label="`${vendor} ${$t('platform integration')}`" :model.sync="settings.platform.enabled"
            :help="$t('Add user availability, queues status monitoring and calling without WebRTC. A paid {vendor} account is required.', {vendor: vendor})"/>

        <Field name="platform_url" type="text" v-if="user.developer"
            :disabled="!settings.platform.enabled"
            :label="$t('Platform URL')" :model.sync="settings.platform.url"
            :help="$t('This URL is used to communicate with the platform API. Don\'t change it unless you know what you\'re doing.')"
            placeholder="https://"/>

        <Field name="telemetry_enabled" type="checkbox"
            :label="$t('Telemetry')" :model.sync="settings.telemetry.enabled"
            :help="$t('Help us improving this software by sending anonimized usage statistics.')"/>

        <div class="settings-actions field is-grouped">
            <button class="button is-primary" @click="save">{{$t('Save')}}</button>
        </div>
    </div>

    <!-- Audio settings -->
    <div class="tab" :class="{'is-active': tabs.active === 'audio'}">
        <div class="ringtone">
            <Field class="ringtone-select" name="ringtone" type="select"
                :disabled="!settings.webrtc.enabled"
                :label="$t('Ringtone')" :model.sync="settings.ringtones.selected"
                :options="settings.ringtones.options"
                :placeholder="$t('Select a ringtone')"/>

            <a class="ringtone-play button is-link" :disabled="!sound.enabled" @click="playSound()">
                <span class="icon is-small">
                    <i class="fa fa-volume-control-phone"></i>
                </span>
            </a>
        </div>

        <!-- Media permission switch -->
        <div class="field">
            <Field name="webrtc_permission" type="checkbox" :disabled="true" class="webrtc-switch"
                :label="$t('Microphone access')" :model.sync="settings.webrtc.permission" />
            <!-- Additional help to guide the user to the browser permission settings. -->
            <em class="help" v-if="settings.webrtc.permission">
                {{$t('The softphone has access to your microphone.')}}
            </em>
            <em class="help" v-else>
                {{$t('The softphone doesn\'t have access to your microphone!')}}
                <ul class="styled-list">
                    <!-- Reference to the popout mode from the popup modus only-->
                    <li v-if="env.isPopout">
                        {{$t('Inspect the browser navigation bar for microphone access.')}}
                        <span class="icon is-small"><i class="fa fa-video-camera"></i></span></i><br/>
                    </li>
                    <li v-if="env.isPopout">
                        {{$t('Refresh or close this tab afterwards to reflect your changes.')}}
                    </li>
                </ul>
            </em>

            <a class="microphone-popout button is-danger" v-if="!env.isPopout && !settings.webrtc.permission" @click="openPopoutView">
                <span class="icon is-small">
                    <i class="fa fa-microphone"></i>
                </span>
                <span>{{$t('Allow microphone permission')}}</span>
            </a>
        </div>

        <!-- Input volume meter check -->
        <div class="field" v-if="settings.webrtc.permission">
            <label for="platform_url" class="label">{{$t('Microphone level')}}</label>
            <em class="help" v-if="settings.webrtc.permission">
                {{$t('Check the volume meter for your microphone responsiveness.')}}
            </em>
            <br/>
            <progress class="progress is-success" :value="sound.inputLevel" max="1"></progress>
        </div>

        <Field name="input_device" type="select" v-if="user.developer"
            :disabled="!settings.webrtc.enabled"
            :label="$t('Input device')" :model.sync="settings.webrtc.sinks.input"
            :options="inputDevice.options"
            :placeholder="$t('Select an input device')"/>

        <Field name="output_device" type="select" v-if="user.developer"
            :disabled="!settings.webrtc.enabled"
            :label="$t('Output device')" :model.sync="settings.webrtc.sinks.output"
            :options="outputDevice.options"
            :placeholder="$t('Select an output device')"/>

        <div class="settings-actions field is-grouped">
            <button class="button is-primary" @click="save">{{$t('Save')}}</button>
        </div>
    </div>


    <!-- Phone preferences -->
    <div class="tab" :class="{'is-active': tabs.active === 'phone'}">
        <Field name="sip_endpoint" type="text"
            :label="$t('SIP server')" :model.sync="settings.sipEndpoint"
            :help="$t('Domainname of the SIP server with websocket support.')"
            :placeholder="$t('SIP server')"/>

        <Field name="webrtc_enabled" type="checkbox"
            :label="$t('WebRTC softphone')" :model.sync="settings.webrtc.enabled"
            :help="$t('Receive incoming calls and make calls using WebRTC.')"/>

        <Field name="webrtc_username" type="text"
            :disabled="!settings.webrtc.enabled"
            :label="$t('VoIP') + ' ' + $t('username')" :model.sync="settings.webrtc.username"
            :placeholder="$t('VoIP account') + ' id'"/>

        <Field name="webrtc_password" type="password"
            :disabled="!settings.webrtc.enabled"
            :label="$t('VoIP') + ' ' + $t('password')" :model.sync="settings.webrtc.password"
            :placeholder="$t('VoIP account') + ' ' + $t('password')"/>

        <div class="settings-actions field is-grouped">
            <button class="button is-primary" @click="save">{{$t('Save')}}</button>
        </div>
    </div>
</div>
