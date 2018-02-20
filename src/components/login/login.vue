<div class="login-component" tabindex="-1" v-on:keyup.enter="login">
    <h1>{{greeting}}</h1>

    <p>
        {{$t('Welcome to your')}} {{app.name}}.
        {{$t('Please enter your {appName} credentials below.', {appName: app.name})}}
    </p>

    <Field name="username" type="text"
        :label="$t('Email address')" :model.sync="user.username"
        :placeholder="$t('Email address')" :autofocus="true"/>

    <Field name="password" type="password"
        :label="$t('Password')" :model.sync="user.password"
        :placeholder="$t('Password')"/>

    <button type="button" class="button is-primary" data-link="login" @click="login">{{$t('Log in')}}</button>
</div>
