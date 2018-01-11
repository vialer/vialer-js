<div class="login-section" tabindex="-1" v-on:keyup.enter="login">

    <Field name="username" type="text"
        :label="$t('Username')" :model.sync="user.username"
        :placeholder="$t('VoIP-account username')"/>

    <Field name="password" type="password"
        :label="$t('Password')" :model.sync="user.password"
        :placeholder="$t('VoIP-account username')"/>

    <button id="login" type="button" class="button is-primary" data-link="login" @click="login">{{$t('Log in')}}</button>

</div>
