<component class="component-step-mic-permission">
    <header>
        {{$t('Microphone access')}}
    </header>

    <div class="step-description">
        {{$t('The software requires access to your microphone to be able to make calls.')}}<br/>
    </div>
    <div class="step-container">
        <MicPermission :soundmeter="false"/>
        <slot name="progress"></slot>
    </div>
</component>
