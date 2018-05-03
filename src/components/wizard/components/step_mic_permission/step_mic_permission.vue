<component class="component-step-mic-permission">
    <header>
        {{$t('Microphone access')}}
    </header>

    <div class="step-description">
        {{$t('Access to your computer\'s microphone is required to be able to make calls.')}}<br/>
    </div>
    <div class="step-container">
        <MicPermission :soundmeter="false"/>
        <slot name="progress"></slot>
    </div>
</component>
