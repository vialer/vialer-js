<component class="component-telemetry">
    <header>{{$t('Usage statistics')}}</header>

    <div class="step-description">
        {{$t('Pseudo-anonymized usage statistics help us to improve the software.')}}
        {{$t('You can change the telemetry permission from the Settings page.')}}
    </div>

    <slot name="progress"></slot>

    <div class="buttons is-centered">
        <span class="button is-primary" @click="toggleTelemetry(true)">{{$t('Yes, let me help')}}</span>
        <span class="button" @click="toggleTelemetry(false)">{{$t('No thanks')}}</span>
    </div>
</component>
