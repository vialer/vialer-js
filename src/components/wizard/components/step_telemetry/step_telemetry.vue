<component class="component-step-telemetry">
    <header class="ca">{{$t('telemetry')}}</header>

    <div class="step-description">
        <span class="cf">{{$t('by collecting information about anonymized usage and errors, we are able to improve this software at a faster pace.')}}</span>
        <br/>
        <em class="help cf">{{$t('you can change this later from the privacy settings.')}}</em>
    </div>

    <slot name="progress"></slot>

    <div class="buttons is-centered">
        <button class="button is-primary cf test-step-telemetry-button-yes" @click="toggleTelemetry(true)">{{$t('yes, let me help')}}</button>
        <button class="button cf test-step-telemetry-button-no" @click="toggleTelemetry(false)">{{$t('no thanks')}}</button>
    </div>
</component>
