<div class="field field-checkbox" v-if="type === 'checkbox'">
    <input class="switch" :class="css" :disabled="disabled" :id="name" type="checkbox" :name="name" @change="updateModel($event)" :checked="model"/>
    <label :for="name" class="checkbox ca" >{{label}}</label>
    <em class="help cf" v-if="help && !invalidFieldValue">{{help}}</em>
    <span v-if="invalidFieldValue" class="validation-message help is-danger" v-html="validationMessage"></span>
    <slot name="checkbox-extra"></slot>
</div>


<div class="field field-color" v-else-if="type === 'color'">
    <label class="label ca" :for="name">{{label}}</label>
    <input class="input" type="color" @change="updateModel($event)"
        v-bind:value="model" :disabled="disabled"/>
</div>


<div class="field field-file" v-else-if="type === 'file'">
    <label class="label ca" :for="name">{{label}}</label>
    <input type="file" />
    <span class="validation-message help is-danger" :class="{hide: invalidFieldValue, show: invalidFieldValue}" v-html="validationMessage"></span>
    <em class="help cf" v-if="help">{{help}}</em>
</div>


<div class="field field-multiselect" v-else-if="type === 'multiselect'">
    <label class="label ca" :class="classes('label')" :for="name">{{label}}</label>
    <div class="control">
        <span class="multi-select">
            <select multiple size=6 class="multi-select" @change="updateModel($event)"
                :id="name" :name="name" :options="options">
                <option v-if="model" :selected="model.includes(option[idfield])" :value="option[idfield]" v-for="option in options">
                    {{$t(option.name)}}
                </option>
            </select>
        </span>
    </div>
    <span v-if="invalidFieldValue" class="validation-message help is-danger" v-html="validationMessage"></span>
    <em class="help cf" v-if="help">{{help}}</em>
</div>


<div class="field field-password" v-else-if="type === 'password'">
    <label class="label ca" :class="classes('label')" :for="name">{{label}}</label>
    <div class="control has-icons-right">
        <input :type="visible ? 'text' : 'password'" :class="classes('input')"
            @input="updateModel($event)" :value="model"
            :id="name" :name="name" :placeholder="placeholder.capitalize()" :disabled="disabled"/>
        <span :class="{visible}" class="icon is-small is-right" @click="toggleVisible()">
            <icon name="eye"/>
        </span>
    </div>
    <em class="help cf" v-if="help">{{help}}</em>
    <span class="validation-message help is-danger" :class="{hide: !invalidFieldValue, show: invalidFieldValue}" v-html="validationMessage"></span>
</div>


<div class="field field-select" v-else-if="type === 'select'">
    <label class="label ca" :class="classes('label')" :for="name">{{label}}</label>
    <div class="control">
        <div v-bind:class="classes('select')">
            <select v-on:change="updateModel($event)" :id="name"
                :name="name" :v-bind:value="model" :disabled="disabled || !options.length">
                <option v-if="!options.length" value="" disabled selected class="cf">{{$t(empty)}}</option>
                <option :value="null" v-else-if="placeholder">{{placeholder.capitalize()}}</option>

                <option v-if="option.name" :selected="option[idfield] === model.id" :value="option[idfield]" v-for="option in options">
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


<div class="field field-text" v-else-if="type === 'text'">
    <label class="label ca" :class="classes('label')" :for="name">{{label}}</label>
    <div class="control">
        <input type="text" :class="classes('input')"
            @input="updateModel($event)" :value="model"
            :id="name" :name="name" :placeholder="placeholder.capitalize()" :disabled="disabled" :autofocus="autofocus"/>
    </div>
    <em class="help cf" v-if="help">{{help}}</em>
    <span class="validation-message help is-danger" :class="{hide: !invalidFieldValue, show: invalidFieldValue}" v-html="validationMessage"></span>
</div>


<div class="field field-textarea" v-else-if="type === 'textarea'">
    <label class="label ca" :class="classes('label')" :for="name">{{label}}</label>
    <textarea class="textarea" v-on:input="updateModel($event)" :value="model.join('\n')"
         :id="name" :name="name" :placeholder="placeholder" :disabled="disabled">{{model.join('\n')}}</textarea>
    <span class="validation-message help is-danger" :class="{hide: !invalidFieldValue, show: invalidFieldValue}" v-html="validationMessage"></span>
</div>
