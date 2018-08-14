<component class="component-account-picker">

    <Field name="webrtc_account" type="select"
        :disabled="!settings.webrtc.toggle"
        :empty="(status === 'loading') ? `${$t('loading accounts').capitalize()}...` : $t('no accounts').capitalize()"
        :help="$t('voIP account that can be used by the softphone.')"
        :label="label" :model.sync="selected"
        :options="settings.webrtc.account.options"
        :placeholder="$t('select an account')"
        :validation="validationField">

        <button slot="select-extra" class="button is-link" :class="{'is-loading': status === 'loading'}" :disabled="status === 'loading' || !settings.webrtc.toggle" @click="refreshAccounts()">
            <span class="icon is-small"><icon name="refresh"/></span>
        </button>

        <!-- This component must be provided by a `vjs-addon-availability-*` module. -->
        <AccountPickerInstructions slot="select-after"/>
    </Field>
</component>
