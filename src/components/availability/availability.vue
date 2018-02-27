<component class="component-availability">
    <div class="panel-content">
        <h1>{{$t('Availability options')}}</h1>

        <!-- Custom field -->
        <div class="field">
            <input class="switch" id="platform_availability" name="platform_availability" type="checkbox"
                :disabled="!destinations.length" v-model="available">
            <label for="platform_availability">{{$t('Availability')}} {{vendor.name}} {{$t('user')}}</label>

            <div v-if="available">
                <Field name="owner" type="select" v-if="available"
                    :model.sync="selected"
                    :options="destinations"
                    :placeholder="$t('Select a destination')"/>

                <div class="notification-box info">
                    <header><svgicon name="info"/><span>{{$t('Changing your availability')}}</span></header>
                    <ul>
                        <li>{{$t('Head over to')}} <a @click="openPlatformUrl(`user/${user.id}/change/#tc0=user-tab-2`)">{{$t('your user settings')}}</a> {{ $t('to manage your {target}', {target: `${vendor.name} ${$t('user')}`}) }}.</li>
                        <li>{{$t('Head over to')}} <a @click="openPlatformUrl('routing')">{{$t('Dialplans')}}</a> {{$t('to manage your {target}', {target: $t('availability')})}}.
                            {{$t('Changing your availability only has effect when your {vendor} user is part of the dialplan for the incoming call.', {vendor: vendor.name})}}
                        </li>
                    </ul>
                </div>

                <em class="help">

                </em>
            </div>
        </div>

        <div class="field">
            <input id="dnd_availability" v-model="dnd" type="checkbox" name="platform_availability" class="switch is-warning"
            :disabled="!webrtc.enabled || callingDisabled">
            <label for="dnd_availability">{{$t('Do not disturb')}} (DnD)</label>
            <em class="help">
                {{$t('Decline incoming calls.')}}
            </em>
        </div>
    </div>
</component>
