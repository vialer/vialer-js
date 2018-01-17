<div class="availability-component panel-content" :class="widgetState">

    <h1>{{$t(name)}}</h1>

    <form class="form form-inline">
        <div class="form-group availability-toggle">
            <label>{{$t('Are you available?')}}</label>
            <div class="radio">
                <label>
                    <input type="radio" :disabled="!module.destinations.length" name="availability" class="form-control" value="yes" v-model="module.available" />
                    <span>{{$t('YES')}}</span>
                </label>
            </div>
            <div class="radio">
                <label>
                    <input type="radio" :disabled="!module.destinations.length" name="availability" class="form-control" value="no" v-model="module.available" />
                    <span>{{$t('NO')}}</span>
                </label>
            </div>
        </div>

        <div class="form-group availability-destination">
            <Field name="owner" type="select"
                :disabled="available !== 'yes'"
                :model.sync="destination"
                :options="destinations"
                :placeholder="$t('Select a destination...')"/>
        </div>
    </form>

    <div class="unauthorized-warning hide">
        {{$t('You are not authorized to change your availability.')}}
    </div>
</div>
