<component class="component-login" tabindex="-1" v-on:keyup.enter="login">
    <header>
        <div class="greeting">{{greeting}}</div>

        <p class="welcome-message">
            {{$t('Welcome to your')}} {{app.name}}.<br/>
            {{$t('Please enter your {appName} credentials below to proceed.', {appName: app.name})}}
        </p>
    </header>

    <Field name="username" type="text"
        :autofocus="true" :label="$t('Username')" :model.sync="user.username"
        :placeholder="$t('Enter your email address')"
        :validation="$v.user.username"/>

    <Field name="password" type="password"
        :label="$t('Password')" :model.sync="user.password"
        :placeholder="$t('Enter your password')"
        :validation="$v.user.password"/>

    <div class="buttons is-centered">
        <button type="button" class="button is-primary" data-link="login"
            :disabled="$v.$invalid"
            @click="login">{{$t('Log in')}}</button>
    </div>

    <footer>
        <div class="forgot-pw"><a :href="`${url}user/password_reset/`" target="_blank">{{$t('Forgot your password?')}}</a></div>
        <div class="help-message">{{$t('Need help?')}}<br/> {{$t('Click on the')}}<i @click="setOverlay('about')"><svgicon name="help"/></i>{{$t('icon')}}</div>
    </footer>
</component>
