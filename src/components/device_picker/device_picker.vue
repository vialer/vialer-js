<component class="component-device-picker">

    <Field name="input_device" type="select"
        :label="$t('headset microphone')"
        :model.sync="devices.sinks.headsetInput"
        :options="devices.input"
        :validation="$v.settings.webrtc.devices.sinks.headsetInput.valid">

        <div slot="select-after" v-if="$v.settings.webrtc.devices.sinks.headsetInput.valid.customValid">
            <em class="help cf">{{$t('does the microphone of your headset respond?')}}</em>
            <Soundmeter class="soundmeter"/>
        </div>
    </Field>

    <Field name="output_device" type="select"
        :help="$v.settings.webrtc.devices.sinks.headsetOutput.valid.customValid ? $t('does the sound test play on the expected device?') : ''"
        :label="$t('headset audio')"
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
        :label="$t('ringtone audio')"
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
</component>
