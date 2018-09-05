<component class="component-wizard-account">
    <header class="ca">{{$t('pick an account')}}</header>


    <div class="step-description">
        <AccountPicker :label="$t('softphone accounts')" :v="$v"/>
        <span class="cf">{{$t('the {name} needs a softphone account to make calls. Choose one of the available accounts above to proceed.', {name: app.name})}}</span>
    </div>
    <slot name="progress"></slot>

    <div class="buttons is-centered">
        <button class="button cf test-wizard-account-back is-left" @click="stepBack()">
            {{$t('back')}}
        </button>
        <button class="button is-primary cf test-wizard-account-next" @click="chooseAccount()" :disabled="!stepValid">
            {{$t('choose account')}}
        </button>
    </div>
</component>
