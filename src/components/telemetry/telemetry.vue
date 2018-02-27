<component class="component-telemetry">
    <h1>{{$t('Software improvements')}}</h1>
    <p class="telemetry-text">
        {{$t('Enabling anonymized usage statistics is the easiest way to help us improve the software.')}}
        {{$t('You can always change this option later from the Settings page.')}}
        <br/><br/>
    </p>
    <p class="telemetry-tldr">
        {{$t('Would you like to help us improving this software?')}}
    </p>

    <div class="buttons is-centered">
      <span class="button is-primary" @click="toggleTelemetry(true)">{{$t('Yes, let me help')}}</span>
      <span class="button" @click="toggleTelemetry(false)">{{$t('No thanks')}}</span>
    </div>
</component>
