<component class="component-wizard-telemetry">
    <header class="ca">{{$t('your privacy')}}</header>

    <div class="step-description">
        <span class="cf">
            {{$t('we are able to improve the {name} faster, when you allow us to process anonymized data about usage statistics and application errors for analysis.', {name: app.name})}}
        </span>
        <span class="cf">
            {{$t('do you want to help?')}}
        </span>
        <em class="help cf">{{$t('you can always change your decision afterwards from the privacy settings.')}}</em>
        <br/>
    </div>

    <slot name="progress"></slot>

    <div class="buttons is-centered">
        <button class="button cf test-wizard-telemetry-no" @click="toggleTelemetry(false)">
            {{$t('no thanks')}}
        </button>
        <button class="button is-primary cf test-wizard-telemetry-yes" @click="toggleTelemetry(true)">
            {{$t('no problem')}}
        </button>
    </div>
</component>
