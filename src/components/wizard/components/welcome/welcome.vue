<component class="component-wizard-welcome">
    <header class="cf">{{greeting}}!</header>

    <div class="step-description">
        <span class="cf">{{$t('with the {name} you can conveniently and safely call encrypted. To get started, we first have to ask you a few setup questions. All of these settings can be changed later from the settings menu.', {name: app.name})}}</span>
    </div>

    <slot name="progress"></slot>

    <div class="buttons is-centered" v-if="selected.ready !== null">
        <button type="button" class="button is-primary cf test-wizard-welcome-next" @click="stepNext()">{{$t('let\'s start')}}</button>
    </div>
</component>
