<component class="component-login" tabindex="-1" v-on:keyup.enter="login">
    <header>
        <div class="greeting">{{greeting}}</div>

        <p class="welcome-message">
            {{$t('Welcome to your')}} {{app.name}}.<br/>
            <span v-if="app.online">
                {{$t('Please enter your {appName} credentials below to proceed.', {appName: app.name})}}
            </span>
            <span class="has-text-danger" v-else>
                {{$t('You are currently offline. Please connect to the internet first.')}}
            </span>
        </p>
    </header>

    <Field name="username" type="text"
        :disabled="!app.online"
        :autofocus="true" :label="$t('Username')" :model.sync="user.username"
        :placeholder="$t('Enter your email address')"
        :validation="$v.user.username"/>

    <Field name="password" type="password"
        :disabled="!app.online"
        :label="$t('Password')" :model.sync="password"
        :placeholder="$t('Enter your password')"
        :validation="$v.password"/>

    <div class="buttons is-centered">
        <button type="button" class="button is-primary" data-link="login"
            :disabled="$v.$invalid"
            @click="login">{{$t('Log in')}}</button>
    </div>

    <footer>
        <div class="forgot-pw"><a :href="`${url}user/password_reset/`" target="_blank">{{$t('Forgot your password?')}}</a></div>
        <div class="help-message">{{$t('Need help?')}}<br/> {{$t('Click on the')}}<i @click="setOverlay('about')"><icon name="help"/></i>{{$t('icon')}}</div>
    </footer>
</component>
