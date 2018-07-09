<component class="component-wizard-telemetry">
    <header class="ca">{{$t('privacy')}}</header>

    <div class="step-description">
        <span class="cf">{{$t('your privacy is important to us.')}}</span>
        <span class="cf">
            {{$t('we solely collect anonymized data about usage statistics and application errors with the purpose to improve the {name} more efficiently.', {name: app.name})}}
        </span>
        <span class="cf">
            {{$t('do you want to help?')}}
        </span>
        <br/>
        <em class="help cf">{{$t('you can always change your decision afterwards from the privacy settings.')}}</em>
    </div>

    <slot name="progress"></slot>

    <button class="button cf back test-wizard-telemetry-back" test="" @click="stepBack()">{{$t('back')}}</button>
    <div class="buttons is-centered">
        <button class="button cf test-wizard-telemetry-no" @click="toggleTelemetry(false)">
            {{$t('no thanks')}}
        </button>
        <button class="button is-primary cf test-wizard-telemetry-yes" @click="toggleTelemetry(true)">
            {{$t('no problem')}}
        </button>
    </div>
</component>
