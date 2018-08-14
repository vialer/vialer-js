<component class="component-wizard">
    <component v-bind:is="steps.selected.name" class="step">
        <div class="progress" slot="progress">
            <div class="step-hl" :class="{active: _step.name === steps.selected.name}" v-for="_step in steps.options"/>
        </div>
    </component>
</component>
