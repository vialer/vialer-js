<component class="component-login" tabindex="-1" v-on:keyup.enter="login">
    <header>
        <div class="greeting">{{greeting}}</div>
        <p class="welcome-message cf">
            {{$t('welcome to your')}} {{app.name}}.<br/>
            <span v-if="!app.session.active && app.session.available.length" class="cf">
                {{$t('select an existing session to continue')}}:
            </span>
            <span v-else-if="!app.session.available.length || app.session.active === 'new'" class="cf">
                {{$t('enter your credentials below to proceed.', {appName: app.name})}}
            </span>
            <span v-else-if="app.session.active" class="cf">
                {{$t('enter the password for session')}}:</br>
                <span class="session-name">{{app.session.active}}</span>
            </span>

        </p>
    </header>

    <!-- Show the session picker when there are sessions, but no session is activated yet.-->
    <div class="sessions" v-if="!app.session.active && app.session.available.length">
        <div v-for="session in app.session.available" class="session">
            <i class="icon-session" @click="selectSession(session)"><icon name="user"/></i>
            <div class="description" @click="selectSession(session)">{{session}}</div>
            <i class="icon-remove status-indicator tooltip tooltip-left" :data-tooltip="$t('remove session')" @click="removeSession(session)">
                <icon name="close"/>
            </i>
        </div>
        <div class="new-session-text cf">
            {{$t('or login using another account')}}:
        </div>
        <div class="session new-session" @click="newSession()">
            <i class="icon-session"><icon class="icon-session" name="plus"/></i>
            <div class="description cf">{{$t('new session')}}</div>
        </div>
    </div>
    <template v-else-if="user.twoFactor">
        <Field name="two_factor_token" type="text"
            :autofocus="true" :label="$t('two factor token')" :model.sync="twoFactorToken.value"
            :placeholder="$t('enter your two factor token')"
            :validation="$v.twoFactorToken.value"/>

        <div class="buttons is-centered">
            <button v-if="app.session.available.length" type="button" class="button cf" @click="selectSession()">{{$t('change session')}}</button>
            <button type="button" class="button is-primary cf" :disabled="$v.$invalid" @click="login">{{$t('log in')}}</button>
        </div>
    </template>
    <!-- Show username/pw when there are no sessions yet or when a new session is selected.-->
    <template v-else-if="!app.session.available.length || app.session.active">
        <Field v-if="app.session.active === 'new' || !app.session.available.length" name="username" type="text"
            :autofocus="true" :label="$t('username')" :model.sync="user.username"
            :placeholder="$t('enter your email address')"
            :validation="$v.user.username"/>

        <Field name="password" type="password"
            :label="$t('password')" :model.sync="password"
            :placeholder="$t('enter your password')"
            :validation="$v.password"/>

        <div class="buttons is-centered">
            <button v-if="app.session.available.length" type="button" class="button cf" @click="selectSession()">{{$t('change session')}}</button>
            <button type="button" class="button is-primary cf" :disabled="$v.$invalid" @click="login">{{$t('log in')}}</button>
        </div>
    </template>


    <footer>
        <div v-if="app.session.active" class="forgot-pw">
            <a :href="`${url}user/password_reset/`" class="cf" target="_blank">{{$t('forgot your password?')}}</a>
        </div>
        <div class="help-message cf">{{$t('need help?')}}<br/> <span class="cf">{{$t('click on the')}}</span><i @click="setOverlay('about')"><icon name="help"/></i>{{$t('icon')}}</div>
    </footer>
</component>
