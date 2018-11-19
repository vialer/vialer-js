<component class="component-device-picker">

    <SelectField name="input_device"
        :label="$t('headset microphone')"
        v-model="devices.sinks.headsetInput"
        :options="devices.input"
        :validation="$v.settings.webrtc.devices.sinks.headsetInput.valid"
        @input="$v.settings.webrtc.devices.sinks.headsetInput.valid.$touch()">
        <div slot="select-after" v-if="$v.settings.webrtc.devices.sinks.headsetInput.valid.customValid">
            <em class="help cf">{{$t('does the microphone of your headset respond?')}}</em>
            <Soundmeter class="soundmeter"/>
        </div>
    </SelectField>

    <SelectField name="output_device"
        :help="$v.settings.webrtc.devices.sinks.headsetOutput.valid.customValid ? $t('does the sound test play on the expected device?') : ''"
        :label="$t('headset audio')"
        v-model="devices.sinks.headsetOutput"
        :options="devices.output"
        :validation="$v.settings.webrtc.devices.sinks.headsetOutput.valid"
        @input="$v.settings.webrtc.devices.sinks.headsetOutput.valid.$touch()">
        <button slot="select-extra" class="ringtone-play button is-link select-button"
            :disabled="playing.headsetOutput" @click="playSound('busyTone', 'headsetOutput')">
            <span class="icon is-small"><icon name="ring"/></span>
        </button>
    </SelectField>

    <SelectField name="sounds_device"
        :help="$v.settings.webrtc.devices.sinks.ringOutput.valid.customValid ? $t('does the sound test play on the expected device?') : ''"
        :label="$t('ringtone audio')"
        v-model="devices.sinks.ringOutput"
        :options="devices.output"
        :validation="$v.settings.webrtc.devices.sinks.ringOutput.valid"
        @input="$v.settings.webrtc.devices.sinks.headsetOutput.valid.$touch()">
        <button slot="select-extra" class="ringtone-play button is-link select-button"
            :disabled="playing.ringOutput" @click="playSound('ringTone', 'ringOutput')">
            <span class="icon is-small"><icon name="ring"/></span>
        </button>
    </SelectField>

    <SelectField v-if="user.developer" name="ringtone"
        class="ringtone-select"
        :label="$t('ringtone audiofile')"
        v-model="ringtones.selected"
        :options="ringtones.options">
        <button slot="select-extra" class="ringtone-play button is-link select-button"
            :disabled="playing.ringOutput" @click="playSound('ringTone', 'ringOutput')">
            <span class="icon is-small"><icon name="ring"/></span>
        </button>
    </SelectField>
</component>
