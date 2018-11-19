<div class="field field-password">
    <label class="label ca" :class="classes('label')" :for="name">{{label}}</label>
    <div class="control has-icons-right">
        <input ref="input"
            :type="visible ? 'text' : 'password'"
            :class="classes('input')"
            :value="value"
            @input="updateModel($event)"
            :id="name"
            :name="name"
            :placeholder="placeholder.capitalize()"
            :disabled="disabled" />
        <span :class="{visible}" class="icon is-small is-right" @click="toggleVisible()">
            <icon name="eye"/>
        </span>
    </div>
    <em class="help cf" v-if="help">{{help}}</em>
    <span class="validation-message help is-danger" :class="{hide: !invalidFieldValue, show: invalidFieldValue}" v-html="validationMessage"></span>
</div>
