<component class="component-voipaccount-picker">
    <!-- Platform integration allows the user to select a voip-account. -->
    <template v-if="app.vendor.type === 'closed'">
        <Field name="webrtc_account" type="select"
            :disabled="!settings.webrtc.enabled"
            :empty="$t('No VoIP accounts')"
            :label="label" :model.sync="selected"
            :options="settings.webrtc.account.options"
            :placeholder="$t('Select a VoIP-account')"
            :validation="validationField">

            <button slot="select-extra" class="button is-link" :class="{'is-loading': loading}" :disabled="loading" @click="refreshVoipaccounts()">
                <span class="icon is-small"><icon name="refresh"/></span>
            </button>
        </Field>

        <!-- Directions for properly managing VoIP-accounts -->
        <template v-if="settings.webrtc.enabled">
            <div class="notification-box info" v-if="!settings.webrtc.account.options.length">
                <header><icon name="info"/><span>{{$t('A VoIP-account is required.')}}</span></header>
                <ul>
                    <li>{{$t('Head over to')}} <a @click="openPlatformUrl(`phoneaccount`)">{{$t('VoIP-accounts')}}</a> {{ $t('to create a VoIP-account.') }}.</li>
                    <li>{{$t('Head over to')}} <a @click="openPlatformUrl(`user/${user.id}/change/#tc0=user-tab-2`)">{{$t('user preferences')}}</a> {{ $t('to manage your {target}', {target: `${vendor.name} ${$t('user')}`}) }}.</li>
                </ul>
            </div>

            <!-- Reference to the popout mode from the popup modus only-->
            <em class="help" v-if="selected.id && selected.settings.ua">
                 <b><a @click="openPlatformUrl(`phoneaccount/${selected.id}/change/`)">{{$t('This account')}}</a></b> {{$t('is possibly in use by device')}}:</br>
                 <i>{{selected.settings.ua}}</i>.
            </em>

            <div class="notification-box troubleshoot" v-if="selected.id && !validVoipSettings">
                <header>
                    <icon name="warning"/><span>{{$t('VoIP account adjustment required.')}}</span>
                </header>
                <ul>
                    <!-- Reference to the popout mode from the popup modus only-->
                    <li v-if="!selected.settings.avpf">
                        {{$t('The option')}} <b><a @click="openPlatformUrl(`phoneaccount/${settings.webrtc.account.selected.id}/change/#tc0=tab-2`)">avpf=yes</a></b>
                        {{$t('is not set in Expert options')}}.
                    </li>
                    <li v-if="!selected.settings.encryption">
                        {{$t('The option')}} <b><a @click="openPlatformUrl(`phoneaccount/${settings.webrtc.account.selected.id}/change/#tc0=tab-2`)">{{$t('Enforce encryption')}}</a></b>
                        {{$t('is not set in Expert options')}}.</li>
                </ul>
            </div>
        </template>
    </template>

    <template v-else-if="settings.webrtc.enabled && app.vendor.type === 'free'">
        <Field name="webrtc_username" type="text"
            :disabled="!settings.webrtc.enabled"
            :label="$t('VoIP') + ' ' + $t('username')" :model.sync="selected.username"
            :placeholder="$t('VoIP account') + ' id'"/>

        <Field name="webrtc_password" type="password"
            :disabled="!settings.webrtc.enabled"
            :label="$t('VoIP') + ' ' + $t('password')" :model.sync="selected.password"
            :placeholder="$t('VoIP account') + ' ' + $t('password')"/>
    </template>
</component>
