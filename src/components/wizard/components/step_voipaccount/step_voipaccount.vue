<component class="component-step-voipaccount">
    <header>
        {{$t('VoIP accounts')}}
    </header>

    <div class="step-description">
        <span>
            {{$t('Select the VoIP account you would like to use for your softphone')}}.
        </span>
    </div>
    <VoipaccountPicker :label="$t('Available VoIP accounts')"/>
    <slot name="progress"></slot>
</component>
