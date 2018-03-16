<component class="component-unlock" tabindex="-1" v-on:keyup.enter="unlock">
    <header>
        <div class="greeting">{{greeting}}</div>

        <p class="welcome-message">
            {{$t('Please enter your password to unlock the {appName}.', {appName: app.name})}}
        </p>
    </header>
    <Field name="password" type="password"
        :label="$t('Password')" :model.sync="user.password"
        :placeholder="$t('Enter your password')"
        :validation="$v.user.password"/>

    <div class="buttons is-centered">
        <button type="button" class="button is-primary" data-link="login"
            :disabled="$v.$invalid"
            @click="unlock">{{$t('Unlock')}}</button>
    </div>

    <footer>
        <div class="forgot-pw"><a :href="`${url}user/password_reset/`" target="_blank">{{$t('Forgot your password?')}}</a></div>
        <div class="help-message">{{$t('Need help?')}}<br/> {{$t('Click on the')}} <i @click="openHelp"><svgicon name="help"/></i>{{$t('icon')}} {{$t('or contact us at')}}</div>
        <div class="support"><a :href="'mailto:' + vendor.support">{{vendor.support}}</a></div>
    </footer>
</component>
