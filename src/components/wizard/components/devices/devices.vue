<component class="component-wizard-devices">
    <header class="ca">{{$t('audio settings')}}</header>

    <div class="step-description">
        <span class="cf">{{$t('make sure your headset is properly connected and inspect the audio device settings below:')}}</span>
        <DevicePicker/>
    </div>

    <slot name="progress"></slot>

    <div class="buttons is-centered">
        <button class="button cf test-wizard-devices-back is-left" @click="stepBack()">
            {{$t('back')}}
        </button>
        <button class="button is-primary cf test-wizard-devices-next" @click="storeDevices()" :disabled="!stepValid">
            {{$t('finish')}}
        </button>
    </div>
</component>
