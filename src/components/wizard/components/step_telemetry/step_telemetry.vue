<component class="component-step-telemetry">
    <header>{{$t('Telemetry')}}</header>

    <div class="step-description">
        {{$t('By collecting information about anonymized usage and errors, we are able to improve this software at a faster pace.')}}
        <em class="help">{{$t('You can also change this option from the settings privacy tab.')}}</em>
    </div>

    <slot name="progress"></slot>

    <div class="buttons is-centered">
        <button class="button is-primary" @click="toggleTelemetry(true)">{{$t('Yes, let me help')}}</button>
        <button class="button" @click="toggleTelemetry(false)">{{$t('No thanks')}}</button>
    </div>
</component>
