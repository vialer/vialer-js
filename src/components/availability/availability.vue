<component class="component-availability padded">
    <h1 class="uc">{{$t('availability options')}}</h1>

    <CheckboxField name="dnd_availability"
        css="is-warning"
        :disabled="!webrtc.enabled"
        :help="$t('decline all incoming softphone calls.')"
        :label="$t('do not disturb')"
        v-model="dnd" />

    <!-- Load additional availability addons. -->
    <template v-for="addon of addons">
        <component v-bind:is="addon"></component>
    </template>
</component>
