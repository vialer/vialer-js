<div class="field" v-if="type === 'checkbox'">
    <input :disabled="disabled" :id="name" type="checkbox" :name="name" v-on:change="vChange($event, $event.target.value)"
        v-bind:checked="vmodel" class="switch"/>
    <label :for="name" class="checkbox" >{{label}}</label>
    <em class="help" v-if="help">{{help}}</em>
</div>

<div class="field" v-else-if="type === 'color'">
    <label class="label" :for="name">{{label}}</label>
    <input class="input" type="color" v-on:change="vChange($event, $event.target.value)"
        v-bind:value="vmodel" :disabled="disabled"/>
</div>

<div class="field" v-else-if="type === 'file'">
    <label class="label" :for="name">{{label}}</label>
    <input type="file" />
    <em class="help" v-if="help">{{help}}</em>
</div>

<div class="field" v-else-if="type === 'multiselect'">
    <label :class="{'required': vRequired(), 'label': true}" :for="name">{{label}}</label>
    <div class="control">
        <span class="multi-select">
            <select multiple size=6 class="multi-select" v-on:change="vChange($event, $event.target.value)" :id="name" :name="name"
                :options="options">
                <option v-if="vmodel" :selected="vmodel.includes(option[idfield])" :value="option[idfield]" v-for="option in options">
                    {{$t(option.name)}}
                </option>
            </select>
        </span>
    </div>
    <span class="help is-danger" v-html="validationMessage" v-if="vInvalid()"></span>
    <em class="help" v-if="help">{{help}}</em>
</div>

<div class="field" v-else-if="type === 'password'">
    <label :class="{'required': vRequired(), 'label': true}" :for="name">{{label}}</label>
    <input type="password" v-bind:class="classes('input')"
        v-on:input="vChange($event, $event.target.value)" v-bind:value="vmodel"
        :id="name" :name="name" :placeholder="placeholder" :disabled="disabled"/>
    <em class="help" v-if="help">{{help}}</em>
    <span class="help is-danger" v-if="vInvalid()" v-html="validationMessage"></span>
</div>

<div class="field" v-else-if="type === 'select'">
    <label class="label" :class="{'required': vRequired()}" :for="name">{{label}}</label>
    <div class="control">
        <div class="select" v-bind:class="classes('select')">
            <select v-on:change="vChange($event, $event.target.value, options)" :id="name"
                :name="name" :v-bind:value="vmodel" :disabled="disabled || !options.length">
                <template v-if="!options.length">
                    <option value="" disabled selected>{{$t(empty)}}</option>
                </template>
                <option :selected="option[idfield] == vmodel.id" :value="option[idfield]" v-for="option in options" v-else>
                    <template v-if="option[idfield] === null && placeholder">{{placeholder}}</template>
                    <template v-else>{{$t(option.name)}}</template>
                </option>
            </select>
        </div>
    </div>
    <span class="help is-danger" v-html="validationMessage" v-if="vInvalid()"></span>
    <em class="help" v-if="help">{{help}}</em>
</div>

<div class="field" v-else-if="type === 'text'">
    <label :class="{'required': vRequired(), 'label': true}" :for="name">{{label}}</label>
    <div class="control">
        <input type="text" v-bind:class="classes('input')"
            v-on:input="vChange($event, $event.target.value)" v-bind:value="vmodel"
            :id="name" :name="name" :placeholder="placeholder" :disabled="disabled" :autofocus="autofocus"/>
    </div>
    <em class="help" v-if="help">{{help}}</em>
    <span class="help is-danger" v-if="vInvalid()" v-html="validationMessage"></span>
</div>

<div class="field" v-else-if="type === 'textarea'">
    <label :class="{'required': vRequired(), 'label': true}" :for="name">{{label}}</label>
    <textarea class="textarea" v-on:input="vChange($event, $event.target.value)" v-bind:value="vmodel"
         :id="name" :name="name" :placeholder="placeholder" :disabled="disabled">{{vmodel}}</textarea>
    <span class="help is-danger" v-html="validationMessage" v-if="vInvalid()"></span>
</div>
