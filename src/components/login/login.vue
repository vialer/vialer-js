<div class="login-section" tabindex="-1" v-on:keyup.enter="login">
    <form class="login-form">
        <label for="username">{{$t('E-mail address')}}</label>
        <input id="username" type="text" tabindex="1" v-model="user.email" />
        <label for="password">{{$t('Password')}}</label>
        <input id="password" type="password" tabindex="2" v-model="user.password" />
        <button id="login" type="button" class="login-button" data-link="login" @click="login"
            data-i18n-attrs='{"data-state-failed": "loginFormLoginFailedText", "data-state-error": "loginFormLoginErrorText", "data-state-logout": "loginFormLogoutText", "data-state-loading": "loginFormLoadingText", "data-state-default": "loginFormLoginButtonText"}'>{{$t('Log in')}}
        </button>
    </form>
</div>
