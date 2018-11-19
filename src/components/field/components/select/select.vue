<div class="field field-select">
    <label class="label ca" :class="classes('label')" :for="name">{{label}}</label>
    <div class="control">
        <div v-bind:class="classes('select')">
            <select :id="name"
                :name="name"
                :value="value.id"
                @change="updateModel($event)"
                :disabled="disabled || !options.length">
                <option v-if="!options.length" value="" disabled selected class="cf">{{$t(empty)}}</option>
                <option :value="null" v-else-if="placeholder">{{placeholder.capitalize()}}</option>

                <option v-for="option in options" v-if="option.name"
                    :value="option[idfield]"
                    :selected="option[idfield] === value.id">
                    {{$t(option.name).capitalize()}}
                </option>
            </select>
        </div>
        <slot name="select-extra"></slot>
    </div>
    <em class="help cf" v-if="help">{{help}}</em>
    <span v-if="invalidFieldValue && validationMessage" class="validation-message is-danger" v-html="validationMessage"></span>
    <slot name="select-after"></slot>
</div>
