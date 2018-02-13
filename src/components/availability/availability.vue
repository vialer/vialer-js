<div class="availability-component">
    <div class="panel-content">
        <h1>{{$t('Availability options')}}</h1>

        <!-- Custom field -->
        <div class="field">
            <input class="switch" id="platform_availability" name="platform_availability" type="checkbox"
                :disabled="!destinations.length" v-model="available">
            <label for="platform_availability">{{$t('Availability')}} {{$store.vendor}} {{$t('user')}}</label>

            <div v-if="available">
                <Field name="owner" type="select" v-if="available"
                    :model.sync="selected"
                    :options="destinations"
                    :placeholder="$t('Select a destination')"/>

                <em class="help">
                    {{$t('Changing your availability only has effect when your {vendor} user is part of the dialplan for the incoming call.', {vendor: vendor})}}
                    {{$t('Head over to')}} <a @click="openPlatformUrl('routing')">{{$t('Dialplans')}}</a> {{$t('to manage your {target}', {target: $t('dialplans')})}}.
                </em>
            </div>
        </div>

        <div class="field">
            <input id="dnd_availability" v-model="dnd" type="checkbox" name="platform_availability" class="switch is-warning"
            :disabled="!webrtc.enabled">
            <label for="dnd_availability">{{$t('Do not disturb')}}</label>
            <em class="help">
                {{$t('Decline incoming WebRTC calls.')}}
            </em>
        </div>
    </div>
</div>
