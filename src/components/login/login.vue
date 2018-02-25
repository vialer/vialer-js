<div class="login-component" tabindex="-1" v-on:keyup.enter="login">
    <header>
        <div class="greeting">{{greeting}}</div>

        <p class="welcome-message">
            {{$t('Welcome to your')}} {{app.name}}.<br/>
            {{$t('Please enter your {appName} credentials below to proceed.', {appName: app.name})}}
        </p>
    </header>

    <Field name="username" type="text"
        :label="$t('Username')" :model.sync="user.username"
        :placeholder="$t('Enter your email address')" :autofocus="true"/>

    <Field name="password" type="password"
        :label="$t('Password')" :model.sync="user.password"
        :placeholder="$t('Enter your password')"/>

    <div class="buttons is-centered">
        <button type="button" class="button is-primary" data-link="login" @click="login">{{$t('Log in')}}</button>
    </div>

    <footer>
        <div class="forgot-pw"><a :href="`${url}user/password_reset/`" target="_blank">{{$t('Forgot your password?')}}</a></div>
        <div class="help-message">{{$t('Need help?')}}<br/> {{$t('Click on the')}} <i @click="openHelp"><svgicon name="help"/></i>{{$t('icon')}} {{$t('or contact us at')}}</div>
        <div class="support"><a :href="'mailto:' + vendor.support">{{vendor.support}}</a></div>
    </footer>
</div>
