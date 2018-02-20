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
        <a>Forgot your password?</a>

        <p>Need help? Click the icon or contact us at</p>
    </footer>
</div>
