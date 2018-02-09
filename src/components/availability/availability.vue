<div class="availability-component">
    <div class="panel-content">
        <h1>{{$t('Availability options')}}</h1>

        <div class="field">
            <input id="platform_availability" v-model="available" type="checkbox" name="platform_availability" class="switch"
            :disabled="!destinations.length">
            <label for="platform_availability">{{$store.vendor}}-{{$t('user')}} {{$t('availability')}}</label>

            <div v-if="available">
                <Field name="owner" type="select" v-if="available"
                    :model.sync="selected"
                    :options="destinations"
                    :placeholder="$t('Select a destination')"/>
                <Field name="owner" type="select" v-else
                    :disabled="!available"
                    :model.sync="placeholder"
                    :options="destinations"
                    :placeholder="$t('Select a destination')"/>
                <em class="help">
                    {{$t('Changing your availability only has effect when your platform user is part of the called number\'s dialplan.')}}
                    {{$t('Head over to')}} <a @click="openPlatformUrl('routing')">{{$t('Callgroups')}}</a> {{$t('to manage {target}', {target: $t('dialplans')})}}.
                </em>
            </div>
        </div>

        <div class="field">
            <input id="dnd_availability" v-model="dnd" type="checkbox" name="platform_availability" class="switch is-warning"
            :disabled="!webrtc.enabled">
            <label for="dnd_availability">{{$t('Do not disturb')}}</label>
            <em class="help">
                {{$t('Declines incoming WebRTC calls.')}}
            </em>
        </div>
    </div>
</div>
