<div class="settings-component">
    <div class="panel-content">

        <div class="tabs">
            <ul>
                <li :class="{'is-active': tabs.active === 'general'}" @click="setTab('general')">
                    <a><span class="icon is-small"><i class="fa fa-user"></i></span><span>{{$t('General')}}</span></a>
                </li>
                <li :class="{'is-active': tabs.active === 'phone'}" @click="setTab('phone')">
                    <a><span class="icon is-small"><i class="fa fa-phone"></i></span><span>{{$t('Phone')}}</span></a>
                </li>
                <li :class="{'is-active': tabs.active === 'audio'}" @click="setTab('audio')">
                    <a><span class="icon is-small"><i class="fa fa-headphones"></i></span><span>Audio</span></a>
                </li>
            </ul>
        </div>


        <!-- User preferences -->
        <div class="tab" :class="{'is-active': tabs.active === 'general'}">
            <Field name="platform_enabled" type="checkbox"
                :label="$t('Platform integration')" :model.sync="settings.platform.enabled"
                :help="$t('Add user availability, queues status monitoring and calling without WebRTC. Requires a paid platform account.')"/>

            <Field name="platform_url" type="text" v-if="user.developer"
                :disabled="!settings.platform.enabled"
                :label="$t('Platform URL')" :model.sync="settings.platform.url"
                :help="$t('This URL is used to communicate with the platform API. Don\'t change it unless you know what you\'re doing.')"
                placeholder="https://"/>

            <Field name="click2dial" type="checkbox"
                :label="$t('Click-to-Dial icons')" :model.sync="settings.click2dial.enabled"
                :help="$t('Add clickable icons next to phonenumbers in webpages.')"
                :placeholder="$t('SIP Server')"/>

            <Field name="telemetry_enabled" type="checkbox"
                :label="$t('Telemetry data')" :model.sync="settings.telemetry.enabled"
                :help="$t('Help us improving this software by sending anonimized usage statistics.')"/>
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
        </div>


        <!-- Audio settings -->
        <div class="tab" :class="{'is-active': tabs.active === 'audio'}">
            <Field name="ringtone" type="select"
                :disabled="!settings.webrtc.enabled"
                :label="$t('Ringtone')" :model.sync="settings.ringtones.selected"
                :options="settings.ringtones.options"
                :placeholder="$t('Select a ringtone')"/>

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
        </div>

        <div class="field is-grouped">
            <button class="button is-primary" @click="save">{{$t('Save')}}</button>
        </div>
    </div>
</div>
