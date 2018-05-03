<component class="component-login" tabindex="-1" v-on:keyup.enter="login">
    <header>
        <div class="greeting">{{greeting}}</div>
        <p class="welcome-message">
            {{$t('Welcome to your')}} {{app.name}}.<br/>
            <span v-if="!app.session.active && app.session.available.length">
                {{$t('Select an existing session to continue')}}:
            </span>
            <span v-else-if="!app.session.available.length || app.session.active === 'new'">
                {{$t('Please enter your credentials below to proceed.', {appName: app.name})}}
            </span>
            <span v-else-if="app.session.active">
                {{$t('Please enter the password for session')}}:</br>
                <span class="session-name">{{app.session.active}}</span>
            </span>

        </p>
    </header>

    <!-- Show the session picker when there are sessions, but no session is activated yet.-->
    <div class="sessions" v-if="!app.session.active && app.session.available.length">
        <div v-for="session in app.session.available" class="session">
            <i class="icon-session" @click="selectSession(session)"><icon name="user"/></i>
            <div class="description" @click="selectSession(session)">{{session}}</div>
            <i class="icon-remove status-indicator tooltip tooltip-left" :data-tooltip="$t('Remove session')" @click="removeSession(session)">
                <icon name="close"/>
            </i>
        </div>
        <div class="new-session-text">
            {{$t('Or login using another account')}}:
        </div>
        <div class="session new-session" @click="newSession()">
            <i class="icon-session"><icon class="icon-session" name="plus"/></i>
            <div class="description">{{$t('New session')}}</div>
        </div>
    </div>
    <template v-else-if="user.twoFactor">
        <Field name="two_factor_token" type="text"
            :autofocus="true" :label="$t('Two factor token')" :model.sync="twoFactorToken.value"
            :placeholder="$t('Enter your two factor token')"
            :validation="$v.twoFactorToken.value"/>

        <div class="buttons is-centered">
            <button v-if="app.session.available.length" type="button" class="button" @click="selectSession()">{{$t('Change session')}}</button>
            <button type="button" class="button is-primary" :disabled="$v.$invalid" @click="login">{{$t('Log in')}}</button>
        </div>
    </template>
    <!-- Show username/pw when there are no sessions yet or when a new session is selected.-->
    <template v-else-if="!app.session.available.length || app.session.active">
        <Field v-if="app.session.active === 'new' || !app.session.available.length" name="username" type="text"
            :autofocus="true" :label="$t('Username')" :model.sync="user.username"
            :placeholder="$t('Enter your email address')"
            :validation="$v.user.username"/>

        <Field name="password" type="password"
            :label="$t('Password')" :model.sync="password"
            :placeholder="$t('Enter your password')"
            :validation="$v.password"/>

        <div class="buttons is-centered">
            <button v-if="app.session.available.length" type="button" class="button" @click="selectSession()">{{$t('Change session')}}</button>
            <button type="button" class="button is-primary" :disabled="$v.$invalid" @click="login">{{$t('Log in')}}</button>
        </div>
    </template>


    <footer>
        <div v-if="app.session.active" class="forgot-pw">
            <a :href="`${url}user/password_reset/`" target="_blank">{{$t('Forgot your password?')}}</a>
        </div>
        <div class="help-message">{{$t('Need help?')}}<br/> {{$t('Click on the')}}<i @click="setOverlay('about')"><icon name="help"/></i>{{$t('icon')}}</div>
    </footer>
</component>
