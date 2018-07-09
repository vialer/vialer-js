<component class="component-device-picker">

    <Field name="input_device" type="select"
        :label="$t('headset audio input')"
        :model.sync="devices.sinks.headsetInput"
        :options="devices.input"
        :validation="$v.settings.webrtc.devices.sinks.headsetInput.valid">

        <div slot="select-after" v-if="$v.settings.webrtc.devices.sinks.headsetInput.valid.customValid">
            <em class="help cf">{{$t('does the microphone of your preferred headset respond?')}}</em>
            <Soundmeter class="soundmeter"/>
        </div>
    </Field>

    <Field name="output_device" type="select"
        :help="$v.settings.webrtc.devices.sinks.headsetOutput.valid.customValid ? $t('does the sound test play on the expected device?') : ''"
        :label="$t('headset audio output')"
        :model.sync="devices.sinks.headsetOutput"
        :options="devices.output"
        :validation="$v.settings.webrtc.devices.sinks.headsetOutput.valid">
        <button slot="select-extra" class="ringtone-play button is-link select-button"
            :disabled="playing.headsetOutput" @click="playSound('busyTone', 'headsetOutput')">
            <span class="icon is-small"><icon name="ring"/></span>
        </button>
    </Field>

    <Field name="sounds_device" type="select"
        :help="$v.settings.webrtc.devices.sinks.ringOutput.valid.customValid ? $t('does the sound test play on the expected device?') : ''"
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
</component>
