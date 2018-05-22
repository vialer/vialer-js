<component class="component-step-voipaccount">
    <header class="ca">{{$t('voIP accounts')}}</header>

    <div class="step-description">
        <span class="cf">{{$t('select the VoIP account you would like to use for your softphone.')}}</span>
    </div>
    <VoipaccountPicker :label="$t('available VoIP accounts')" :v="$v"/>
    <slot name="progress"></slot>
</component>
