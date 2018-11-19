<component class="component-account-picker">

    <SelectSearchField name="webrtc_account"
        :disabled="!settings.webrtc.toggle"
        :empty="(account.status === 'loading') ? `${$t('loading accounts').capitalize()}...` : $t('no accounts').capitalize()"
        :help="$t('account that will be used to call with.')"
        :label="label"
        v-model="account.selected"
        :options="account.options"
        :placeholder="`${$t('no account selected')}...`"
        :validation="validationField">

        <button slot="select-extra" class="button is-link"
            :class="{'is-loading': account.status === 'loading'}"
            :disabled="account.status === 'loading' || !settings.webrtc.toggle"
            @click="refreshAccounts()">
            <span class="icon is-small"><icon name="refresh"/></span>
        </button>

        <!-- This component must be provided by a `vjs-addon-availability-*` module. -->
        <AccountPickerInstructions slot="select-after"/>
    </SelectSearchField>

</component>
