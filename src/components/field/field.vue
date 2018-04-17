<div class="field field-checkbox" v-if="type === 'checkbox'">
    <input class="switch" :disabled="disabled" :id="name" type="checkbox" :name="name" @change="updateModel($event)" :checked="model"/>
    <label :for="name" class="checkbox" >{{label}}</label>
    <em class="help" v-if="help">{{help}}</em>
</div>


<div class="field field-color" v-else-if="type === 'color'">
    <label class="label" :for="name">{{label}}</label>
    <input class="input" type="color" @change="updateModel($event)"
        v-bind:value="model" :disabled="disabled"/>
</div>


<div class="field field-file" v-else-if="type === 'file'">
    <label class="label" :for="name">{{label}}</label>
    <input type="file" />
    <em class="help" v-if="help">{{help}}</em>
</div>


<div class="field field-multiselect" v-else-if="type === 'multiselect'">
    <label class="label" :class="classes('label')" :for="name">{{label}}</label>
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
    <span class="help is-danger" v-html="validationMessage" v-if="invalidFieldValue"></span>
    <em class="help" v-if="help">{{help}}</em>
</div>


<div class="field field-password" v-else-if="type === 'password'">
    <label class="label" :class="classes('label')" :for="name">{{label}}</label>
    <input type="password" :class="classes('input')"
        @input="updateModel($event)" :value="model"
        :id="name" :name="name" :placeholder="placeholder" :disabled="disabled"/>
    <em class="help" v-if="help">{{help}}</em>
    <span class="help is-danger" v-if="invalidFieldValue" v-html="validationMessage"></span>
</div>


<div class="field field-select" v-else-if="type === 'select'">
    <label class="label" :class="classes('label')" :for="name">{{label}}</label>
    <div class="control">
        <div v-bind:class="classes('select')">
            <select v-on:change="updateModel($event)" :id="name"
                :name="name" :v-bind:value="model" :disabled="disabled || !options.length">
                <template v-if="!options.length">
                    <option value="" disabled selected>{{empty}}</option>
                </template>
                <option :selected="option[idfield] == model.id" :value="option[idfield]" v-for="option in options" v-else>
                    <template v-if="option[idfield] === null && placeholder">{{placeholder}}</template>
                    <template v-else>{{$t(option.name)}}</template>
                </option>
            </select>
        </div>
        <slot name="select-extra"></slot>
    </div>
    <span class="help is-danger" v-html="validationMessage" v-if="invalidFieldValue"></span>
    <em class="help" v-if="help">{{help}}</em>
</div>


<div class="field field-text" v-else-if="type === 'text'">
    <label class="label" :class="classes('label')" :for="name">{{label}}</label>
    <div class="control">
        <input type="text" :class="classes('input')"
            @input="updateModel($event)" :value="model"
            :id="name" :name="name" :placeholder="placeholder" :disabled="disabled" :autofocus="autofocus"/>
    </div>
    <em class="help" v-if="help">{{help}}</em>
    <span class="help is-danger" v-if="invalidFieldValue" v-html="validationMessage"></span>
</div>


<div class="field field-textarea" v-else-if="type === 'textarea'">
    <label class="label" :class="classes('label')" :for="name">{{label}}</label>
    <textarea class="textarea" v-on:input="updateModel($event)" :value="model.join('\n')"
         :id="name" :name="name" :placeholder="placeholder" :disabled="disabled">{{model.join('\n')}}</textarea>
    <span class="help is-danger" v-html="validationMessage" v-if="invalidFieldValue"></span>
</div>
