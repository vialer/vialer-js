<component class="component-voipaccount-picker">
    <!-- Platform integration allows the user to select a voip-account. -->
    <template v-if="app.vendor.type === 'closed'">
        <Field name="webrtc_account" type="select"
            :empty="$t('No VoIP accounts')"
            :label="label" :model.sync="settings.webrtc.account.selected"
            :options="settings.webrtc.account.options"
            :placeholder="$t('Select a VoIP-account')"
            :validation="$v.settings.webrtc.account.selected.id">

            <button slot="select-extra" class="ringtone-play button is-link select-button" @click="refreshVoipaccounts()">
                <span class="icon is-small"><icon name="refresh"/></span>
            </button>
        </Field>

        <div class="notification-box info" v-if="!settings.webrtc.account.options.length">
            <header><icon name="info"/><span>{{$t('A VoIP-account is required.')}}</span></header>
            <ul>
                <li>{{$t('Head over to')}} <a @click="openPlatformUrl(`phoneaccount`)">{{$t('VoIP-accounts')}}</a> {{ $t('to create a VoIP-account.') }}.</li>
                <li>{{$t('Head over to')}} <a @click="openPlatformUrl(`user/${user.id}/change/#tc0=user-tab-2`)">{{$t('user preferences')}}</a> {{ $t('to manage your {target}', {target: `${vendor.name} ${$t('user')}`}) }}.</li>
            </ul>
        </div>
        <!-- Allow hiding the hints for managing VoIP-accounts -->
        <div class="notification-box info" v-else-if="info && settings.webrtc.enabled">
            <header>
                <icon name="info"/><span>{{$t('Manage users and VoIP accounts from ')}} {{$t(app.vendor.portal.name)}}</span>
            </header>
            <ul>
                <!-- Reference to the popout mode from the popup modus only-->
                <li>{{$t('Make sure')}} <b><a @click="openPlatformUrl(`phoneaccount`)">{{$t('the account')}}</a></b> {{$t('is not in use by another device')}}.</li>
                <li v-if="!settings.webrtc.account.selected.options.avpf">{{$t('Make sure')}} <b><a @click="openPlatformUrl(`phoneaccount/${settings.webrtc.account.selected.id}/change/#tc0=tab-2`)">avpf=yes</a></b> {{$t('is set in Expert options')}}.</li>
                <li v-if="!settings.webrtc.account.selected.options.encryption">{{$t('Make sure')}} <b><a @click="openPlatformUrl(`phoneaccount/${settings.webrtc.account.selected.id}/change/#tc0=tab-2`)">{{$t('Enforce encryption')}}</a></b> {{$t('is set in Expert options')}}.</li>
            </ul>
        </div>
    </template>

    <template v-else-if="settings.webrtc.enabled && app.vendor.type === 'free'">
        <Field name="webrtc_username" type="text"
            :disabled="!settings.webrtc.enabled"
            :label="$t('VoIP') + ' ' + $t('username')" :model.sync="settings.webrtc.account.selected.username"
            :placeholder="$t('VoIP account') + ' id'"/>

        <Field name="webrtc_password" type="password"
            :disabled="!settings.webrtc.enabled"
            :label="$t('VoIP') + ' ' + $t('password')" :model.sync="settings.webrtc.account.selected.password"
            :placeholder="$t('VoIP account') + ' ' + $t('password')"/>
    </template>
</component>
