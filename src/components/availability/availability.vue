<component class="component-availability panel-content">
    <h1 class="uc">{{$t('availability options')}}</h1>

    <Field name="dnd_availability" type="checkbox"
        css="is-warning"
        :disabled="!webrtc.enabled"
        :help="$t('decline incoming softphone calls.')"
        :label="$t('do not disturb')"
        :model.sync="dnd"/>

    <Field name="platform_availability" type="checkbox"
        :label="`${$t('availability')} ${vendor.name} ${$t('user')}`"
        :model.sync="available">

        <template slot="checkbox-extra">
            <div v-if="available">
                <Field name="owner" type="select" v-if="available"
                    :model.sync="selected"
                    :options="destinations"
                    :placeholder="$t('select a destination')"/>
            </div>
            <div class="notification-box info">
                <header><icon name="info"/><span class="cf">{{$t('changing the availability of your {user}', {user: `${vendor.name} ${$t('user')}`})}}</span></header>
                <ul v-if="destinations.length">
                    <li>{{$t('head over to')}} <a @click="openPlatformUrl(`user/${user.id}/change/#tc0=user-tab-2`)">{{$t('user preferences')}}</a> {{ $t('to manage your {target}', {target: `${vendor.name} ${$t('user')}`}) }}.</li>
                    <li>{{$t('head over to')}} <a class="cf" @click="openPlatformUrl('routing')">{{$t('dialplans')}}</a> {{$t('to manage your {target}', {target: $t('availability')})}}.
                        <span class="cf">{{$t('changing your availability only has effect when your {vendor} user is part of the dialplan for the incoming call.', {vendor: vendor.name})}}</span>
                    </li>
                </ul>
                <ul v-else>
                    <li>
                        <span class="cf">{{$t('your user doesn\'t have any destinations yet; user destinations are required, before you can change your availability.')}}</span>
                        <span class="cf">{{$t('head over to')}} <a @click="openPlatformUrl(`user/${user.id}/change/#tc0=user-tab-2`)">{{$t('user preferences')}}</a> {{ $t('to manage your {target}', {target: `${vendor.name} ${$t('user')}`}) }}.</span>
                    </li>
                    <li class="cf">{{$t('use the')}} <icon name='refresh'></icon> {{$t('refresh option to reflect changes from the')}} {{vendor.portal.name}}.</li>
                </ul>
            </div>
        </template>
    </Field>
</component>
