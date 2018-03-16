<component class="component-telemetry">
    <h1>{{$t('Telemetry permission')}}</h1>
    <p class="telemetry-text">
        {{$t('Pseudo-anonymized usage statistics help us to improve the software.')}}
        {{$t('You can change the telemetry permission from the Settings page.')}}
        <br/><br/>
    </p>
    <p class="telemetry-tldr">
        {{$t('Would you like to help us?')}}
    </p>

    <div class="buttons is-centered">
      <span class="button is-primary" @click="toggleTelemetry(true)">{{$t('Yes, let me help')}}</span>
      <span class="button" @click="toggleTelemetry(false)">{{$t('No thanks')}}</span>
    </div>
</component>
