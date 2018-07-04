<component class="component-voipaccount-picker">
    <!-- Platform integration allows the user to select a voip-account. -->

    <Field name="webrtc_account" type="select" v-if="app.vendor.type === 'closed'"
        :disabled="!settings.webrtc.enabled"
        :empty="(status === 'loading') ? `${$t('loading VoIP accounts')}...` : $t('no VoIP accounts')"
        :help="$t('voIP account to use as your softphone.')"
        :label="label" :model.sync="selected"
        :options="settings.webrtc.account.options"
        :placeholder="$t('select a VoIP account')"
        :validation="validationField">

        <button slot="select-extra" class="button is-link" :class="{'is-loading': status === 'loading'}" :disabled="status === 'loading'" @click="refreshVoipaccounts()">
            <span class="icon is-small"><icon name="refresh"/></span>
        </button>

        <template slot="select-after">
            <div v-if="selected.id && (selected.settings && selected.settings.ua)" class="registration-notice">
                 <a class="cf" @click="openPlatformUrl(`phoneaccount/${selected.id}/change/`)">{{$t('registered')}}</a>:
                 <i v-if="selected.settings">{{selected.settings.ua}}</i>
            </div>
            <!-- Directions for the user to manage their VoIP accounts. -->
            <template>
                <!-- This message is shown when there are no voipaccount options. -->
                <div class="notification-box info" v-if="!settings.webrtc.account.options.length && !(status === 'loading')">
                    <header><icon name="info"/><span class="cf">{{$t('a VoIP account is required.')}}</span></header>
                    <ul>
                        <li>{{$t('head over to')}} <a class="cf" @click="openPlatformUrl(`phoneaccount`)">{{$t('voIP accounts')}}</a> {{ $t('to create a VoIP account.') }}.</li>
                        <li>{{$t('head over to')}} <a @click="openPlatformUrl(`user/${user.id}/change/#tc0=user-tab-2`)">{{$t('user preferences')}}</a> {{ $t('to manage your {target}', {target: `${vendor.name} ${$t('user')}`}) }}.</li>
                    </ul>
                </div>

                <!-- Warn when the user is about to choose a voipaccouint with incorrect settings. -->
                <div class="notification-box troubleshoot" v-if="selected.id && !validVoipSettings && settings.webrtc.enabled">
                    <header>
                        <icon name="warning"/><span class="cf">{{$t('voIP account adjustment required in')}} {{vendor.portal.name}}</span>
                    </header>
                    <ul>
                        <li v-if="!selected.settings.encryption" class="cf">
                            {{$t('the option')}} <b><a class="cf" @click="openPlatformUrl(`phoneaccount/${settings.webrtc.account.selected.id}/change/#tc0=tab-2`)">{{$t('enforce encryption')}}</a></b>
                            {{$t('is needed in')}} <i class="ca">{{$t('connection handling')}}</i>.
                        </li>
                        <li v-if="!selected.settings.avpf" class="cf">
                            {{$t('the option')}} <b><a @click="openPlatformUrl(`phoneaccount/${settings.webrtc.account.selected.id}/change/#tc0=tab-2`)">avpf=yes</a></b>
                            {{$t('is needed in')}} <i class="ca">{{$t('expert options')}}</i>.
                        </li>
                    </ul>
                </div>
            </template>
        </template>
    </Field>


    <div v-else-if="settings.webrtc.enabled && app.vendor.type === 'free'">
        <Field name="webrtc_username" type="text"
            :disabled="!settings.webrtc.enabled"
            :label="$t('voIP') + ' ' + $t('username')" :model.sync="selected.username"
            :placeholder="$t('voIP account') + ' id'"/>

        <Field name="webrtc_password" type="password"
            :disabled="!settings.webrtc.enabled"
            :label="$t('voIP') + ' ' + $t('password')" :model.sync="selected.password"
            :placeholder="$t('voIP account') + ' ' + $t('password')"/>
    </div>
</component>
