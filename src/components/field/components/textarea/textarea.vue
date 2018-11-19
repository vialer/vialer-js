<div class="field field-textarea">
    <label class="label ca" :class="classes('label')" :for="name">{{label}}</label>
    <textarea class="textarea"
        :id="name"
        :name="name"
        :placeholder="placeholder"
        @input="updateModel($event)"
        :disabled="disabled">{{value.join('\n')}}</textarea>
    <span class="validation-message help is-danger" :class="{hide: !invalidFieldValue, show: invalidFieldValue}" v-html="validationMessage"></span>
</div>
