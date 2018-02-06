<div class="availability-component">
    <div class="panel-content">
        <h1>{{$t('Availability')}}</h1>

        <span>{{$t('Are you available?')}}</span><br/>
        <div class="field">
            <div class="control">
                <label class="radio">
                    <input type="radio" name="question" value="yes" v-model="available" :disabled="!destinations.length">
                    {{$t('Yes')}}
                </label>
                <label class="radio">
                    <input type="radio" name="question" value="no" v-model="available" :disabled="!destinations.length">
                    {{$t('No')}}
                </label>
            </div>
            <em class="help">{{$t('Setting your availability only has effect when your platform user is part of the phonenumber\'s involved dialplan.')}}</em>
        </div>

        <Field name="owner" type="select" v-if="available !== 'no'"
            :model.sync="selected"
            :options="destinations"
            :placeholder="$t('Select a destination')"/>
        <Field name="owner" type="select" v-else
            :disabled="available !== 'yes'"
            :model.sync="placeholder"
            :options="destinations"
            :placeholder="$t('Select a destination')"/>
    </div>
</div>
