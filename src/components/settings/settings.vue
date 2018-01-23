<div class="settings-component">

    <Field name="sip_endpoint" type="text"
        :label="$t('SIP Endpoint')" :model.sync="settings.sipEndpoint"
        :help="$t('The URL to the websocket SIP backend')"
        :placeholder="$t('SIP Server')"/>

    <Field name="webrtc_enabled" type="checkbox"
        :label="$t('Enable softphone')" :model.sync="settings.webrtc.enabled"
        :help="$t('SIP register and WebRTC audio')"/>

    <Field name="webrtc_username" type="text"
        :disabled="!settings.webrtc.enabled"
        :label="$t('Username')" :model.sync="settings.webrtc.username"
        :placeholder="$t('VoIP-account username')"/>

    <Field name="webrtc_password" type="password"
        :disabled="!settings.webrtc.enabled"
        :label="$t('Password')" :model.sync="settings.webrtc.password"
        :placeholder="$t('VoIP-account password')"/>

    <Field name="ringtone" type="select"
        :disabled="!settings.webrtc.enabled"
        :label="$t('Ringtone')" :model.sync="settings.ringtones.selected"
        :options="settings.ringtones.options"
        :placeholder="$t('Select a ringtone')"/>

    <Field name="input_device" type="select"
        :disabled="!settings.webrtc.enabled"
        :label="$t('Input device') + ' ' + $t('(experimental)')" :model.sync="settings.webrtc.sinks.input"
        :options="inputDevice.options"
        :placeholder="$t('Select an input device')"/>

    <Field name="output_device" type="select"
        :disabled="!settings.webrtc.enabled"
        :label="$t('Output device') + ' ' + $t('(experimental)')" :model.sync="settings.webrtc.sinks.output"
        :options="outputDevice.options"
        :placeholder="$t('Select an output device')"/>

    <Field name="platform_enabled" type="checkbox"
        :label="$t('Enable platform integration')" :model.sync="settings.platform.enabled"
        :help="$t('Adds platform features like Availability, queues status & Click-to-dial')"/>

    <Field name="platform_url" type="text"
        :disabled="!settings.platform.enabled"
        :label="$t('Platform URL')" :model.sync="settings.platform.url"
        :help="$t('The URL to the websocket SIP backend')"
        placeholder="https://"/>

    <Field name="click2dial" type="checkbox"
        :label="$t('Click-to-Dial icons')" :model.sync="settings.click2dial.enabled"
        :help="$t('Add clickable icons next to phonenumbers in webpages')"
        :placeholder="$t('SIP Server')"/>

    <Field name="telemetry_enabled" type="checkbox"
        :label="$t('Enable telemetry')" :model.sync="settings.telemetry.enabled"
        :help="$t('Help us improving this software by allowing telemetry data to be sent')"/>

    <div class="field is-grouped">
        <div class="control">
            <button class="button is-primary" @click="save">{{$t('Save')}}</button>
        </div>
    </div>
</div>
