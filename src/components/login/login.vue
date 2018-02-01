<div class="login-component" tabindex="-1" v-on:keyup.enter="login">
    <Field name="username" type="text" 
        :label="$t('Email address')" :model.sync="user.email"
        :placeholder="$t('Email address')"/>

    <Field name="password" type="password"
        :label="$t('Password')" :model.sync="user.password"
        :placeholder="$t('Password')"/>

    <button type="button" class="button is-primary" data-link="login" @click="login">{{$t('Log in')}}</button>
</div>
