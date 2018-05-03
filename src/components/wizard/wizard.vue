<component class="component-wizard">
    <StepWelcome v-if="steps[step].name === 'welcome'" class="step">
        <div class="progress" slot="progress">
            <div class="step-hl" :class="{active: _step.name === steps[step].name}" v-for="_step in steps"/>
        </div>
    </StepWelcome>

    <StepTelemetry v-else-if="steps[step].name === 'telemetry'" class="step">
        <div class="progress" slot="progress">
            <div class="step-hl" :class="{active: _step.name === steps[step].name}" v-for="_step in steps"/>
        </div>
    </StepTelemetry>

    <StepVoipaccount v-else-if="steps[step].name === 'voipaccount'" class="step">
        <div class="progress" slot="progress">
            <div class="step-hl" :class="{active: _step.name === steps[step].name}" v-for="_step in steps"/>
        </div>
    </StepVoipaccount>

    <StepMicPermission v-else-if="steps[step].name === 'microphone'" class="step">
        <div class="progress" slot="progress">
            <div class="step-hl" :class="{active: _step.name === steps[step].name}" v-for="_step in steps"/>
        </div>
    </StepMicPermission>

    <div class="buttons is-centered" v-if="steps[step].ready !== null">
        <button v-if="step === steps.length - 1" type="button" class="button is-primary" :disabled="!steps[step].ready" @click="finish()">{{$t('Finish setup')}}</button>
        <button v-else type="button" class="button is-primary" :disabled="!steps[step].ready" @click="nextStep()">{{$t('Next')}}</button>
    </div>
</component>
