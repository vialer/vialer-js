<component class="component-availability panel-content">
    <h1>{{$t('Availability options')}}</h1>

    <Field name="dnd_availability" type="checkbox"
        :disabled="!webrtc.enabled"
        :help="$t('Decline incoming softphone calls.')"
        :label="$t('Do not disturb')"
        :model.sync="dnd"/>

    <Field name="platform_availability" type="checkbox"
        :label="`${$t('Availability')} ${vendor.name} ${$t('user')}`"
        :model.sync="available">

        <template slot="checkbox-extra">
            <div v-if="available">
                <Field name="owner" type="select" v-if="available"
                    :model.sync="selected"
                    :options="destinations"
                    :placeholder="$t('Select a destination')"/>
            </div>
            <div class="notification-box info">
                <header><icon name="info"/><span>{{$t('Changing the availability of your {user}', {user: `${vendor.name} ${$t('user')}`})}}</span></header>
                <ul v-if="destinations.length">
                    <li>{{$t('Head over to')}} <a @click="openPlatformUrl(`user/${user.id}/change/#tc0=user-tab-2`)">{{$t('user preferences')}}</a> {{ $t('to manage your {target}', {target: `${vendor.name} ${$t('user')}`}) }}.</li>
                    <li>{{$t('Head over to')}} <a @click="openPlatformUrl('routing')">{{$t('Dialplans')}}</a> {{$t('to manage your {target}', {target: $t('availability')})}}.
                        {{$t('Changing your availability only has effect when your {vendor} user is part of the dialplan for the incoming call.', {vendor: vendor.name})}}
                    </li>
                </ul>
                <ul v-else>
                    <li>
                        {{$t('You user doesn\'t have any destinations yet. User destinations are required, before you can change your availability.')}}
                        {{$t('Head over to')}} <a @click="openPlatformUrl(`user/${user.id}/change/#tc0=user-tab-2`)">{{$t('user preferences')}}</a> {{ $t('to manage your {target}', {target: `${vendor.name} ${$t('user')}`}) }}.
                    </li>
                    <li>{{$t('Use the')}} <icon name='refresh'></icon> {{$t('refresh option to reflect changes from the')}} {{vendor.portal.name}}.</li>
                </ul>
            </div>
        </template>
    </Field>
</component>
