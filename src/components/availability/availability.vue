<component class="component-availability padded">
    <h1 class="uc">{{$t('availability options')}}</h1>

    <Field name="dnd_availability" type="checkbox"
        css="is-warning"
        :disabled="!webrtc.enabled"
        :help="$t('decline all incoming softphone calls.')"
        :label="$t('do not disturb')"
        :model.sync="dnd"/>

    <!-- Load additional availability addons. -->
    <template v-for="addon of addons">
        <component v-bind:is="addon"></component>
    </template>
</component>
