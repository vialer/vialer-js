<component class="component-wizard-mic-permission">
    <header class="cf">{{$t('microphone access')}}</header>

    <div class="step-description">
        <span v-if="!permission" class="cf">{{$t('the {name} needs access to your microphone before a call can be made.', {name: app.name})}}</span>
        <MicPermission :soundmeter="false" />
        <span class="after-permission-text cf" v-if="permission">
            <span class="cf">{{$t('almost there!')}}</span>
            <span class="cf">{{$t('let\'s review your audio settings now to make sure that the correct audio devices will be used.', {name: app.name})}}</span>
        </span>
        <slot name="progress"></slot>

        <div class="buttons is-centered">
            <button class="button cf test-wizard-mic-permission-back is-left" @click="stepBack()">
                {{$t('back')}}
            </button>

            <button class="button is-primary cf test-wizard-mic-permission-next" @click="queryDevices()" :disabled="!stepValid">
                {{$t('next')}}
            </button>
        </div>
    </div>
</component>
