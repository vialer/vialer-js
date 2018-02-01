<div class="availability-component" :class="widgetState">

    <h1>{{$t('Availability')}}</h1>

    <span>{{$t('Are you available?')}}</span>
    <div class="options">
        <label>
            <input type="radio" :disabled="!destinations.length" name="availability" value="yes" v-model="available" />
            <span>{{$t('YES')}}</span>
        </label>
        <label>
            <input type="radio" :disabled="!destinations.length" name="availability" value="no" v-model="available" />
            <span>{{$t('NO')}}</span>
        </label>
    </div>

    <Field name="owner" type="select"
        :disabled="available !== 'yes'"
        :model.sync="destination"
        :options="destinations"
        :placeholder="$t('Select a destination...')"/>
</div>
