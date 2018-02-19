<div class="telemetry-component">
    <h1>{{$t('Help us improving this software')}}</h1>
    <p class="telemetry-text">
        {{$t('We are asking you to allow us to collect anonymized usage statistics.')}}
        {{$t('This is the most direct way for you to give us feedback about how to improve this software, because it gives us automated insight about generic usage patterns.')}}
        {{$t('You can always change this option later from the Settings page.')}}<br/><br/>
    </p>
    <p class="telemetry-tldr">
    {{$t('Would you like to help us improving this software?')}}
</p>

    <div class="buttons is-centered">
      <span class="button is-primary" @click="toggleTelemetry(true)">{{$t('Yes, let me help')}}</span>
      <span class="button" @click="toggleTelemetry(false)">{{$t('No thanks')}}</span>
    </div>
</div>
