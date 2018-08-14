<component class="component-wizard-welcome">
    <header class="cf">{{greeting}}</header>

    <div class="step-description">
        <span class="cf">{{$t('welcome to the')}} {{app.name}}!</span><br/>
        <span class="cf">{{$t('with the {name} you can conveniently place, receive and transfer calls straight from your browser. To get started with the {name}, we need to ask you a few setup questions first.', {name: app.name})}}</span>
    </div>

    <slot name="progress"></slot>

    <div class="buttons is-centered" v-if="selected.ready !== null">
        <button type="button" class="button is-primary cf test-wizard-welcome-next" @click="stepNext()">{{$t('let\'s start')}}</button>
    </div>
</component>
