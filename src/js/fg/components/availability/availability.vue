<div class="widget availability" :class="widgetState">
    <div class="widget-header" v-on:click="toggleActive('availability')">
        <div class="widget-header-icons">
            <i class="widget-icon icon-availability"></i>
            <i class="busy-icon icon-refresh icon-spin"></i>
            <i class="unauthorized-icon icon-warning hide"></i>
        </div>

        <div class="widget-header-text">{{$t('Availability')}}</div>
        <span class="status-indicators"></span>
    </div>

    <div class="widget-content">
        <form class="form form-inline">
            <div class="form-group availability-toggle">
                <label>{{$t('Are you available?')}}</label>
                <div class="radio">
                    <label>
                        <input type="radio" :disabled="!module.destinations.options.length" name="availability" class="form-control" value="yes" v-model="module.available" />
                        <span>{{$t('YES')}}</span>
                    </label>
                </div>
                <div class="radio">
                    <label>
                        <input type="radio" :disabled="!module.destinations.options.length" name="availability" class="form-control" value="no" v-model="module.available" />
                        <span>{{$t('NO')}}</span>
                    </label>
                </div>
            </div>

            <div class="form-group availability-destination">
                <select id="statusupdate" class="form-control" @change="changeDestination">
                    <optgroup label="Fixed destinations">
                        <option v-for="option in module.userdestination.fixeddestinations" v-bind:value="'fixeddestination-' + option.id" :selected="findSelectedDestination(option)">
                            {{option.phonenumber}} - {{option.description}}
                        </option>
                    </optgroup>
                    <optgroup label="VoIP accounts">
                        <option v-for="option in module.userdestination.phoneaccounts" v-bind:value="'phoneaccount-' + option.id" :selected="findSelectedDestination(option)">
                            {{option.internal_number}} - {{option.description}}
                        </option>
                    </optgroup>
                </select>
            </div>
        </form>
    </div>
    <div class="unauthorized-warning hide">
        {{$t('You are not authorized to change your availability.')}}
    </div>
</div>
