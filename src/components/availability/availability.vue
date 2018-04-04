<component class="component-availability panel-content">
    <h1>{{$t('Availability options')}}</h1>

    <div class="field">
        <input class="switch" id="platform_availability" name="platform_availability" type="checkbox"
            :disabled="!destinations.length" v-model="available">
        <label for="platform_availability">{{$t('Availability')}} {{vendor.name}} {{$t('user')}}</label>

        <div v-if="available">
            <Field name="owner" type="select" v-if="available"
                :model.sync="selected"
                :options="destinations"
                :placeholder="$t('Select a destination')"/>
        </div>
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

    <div class="field">
        <input id="dnd_availability" v-model="dnd" type="checkbox" name="platform_availability" class="switch is-warning"
        :disabled="!webrtc.enabled || callingDisabled">
        <label for="dnd_availability">{{$t('Do not disturb')}} (Do not Disturb)</label>
        <em class="help">
            {{$t('Decline incoming softphone calls.')}}
        </em>
    </div>
</component>
