<component class="component-login" tabindex="-1" v-on:keyup.enter="login">

    <header>
        <div class="greeting">{{greeting}}</div>
        <p class="welcome-message cf">
            {{$t('welcome to the')}} {{app.name}}!<br/>
            <span v-if="!app.session.active && app.session.available.length" class="cf">
                {{$t('continue with an existing session')}}:
            </span>
            <span v-else-if="!app.session.available.length || app.session.active === 'new' || user.status === 'login'" class="cf">
                {{$t('enter your credentials below to proceed')}}:
            </span>

            <span v-else-if="app.session.active" class="cf">
                {{$t('enter the password for session')}}:</br>
                <span class="session-name">{{app.session.active}}</span>
            </span>
        </p>
    </header>

    <!-- User login second step: enter a two-factor token.-->
    <div v-if="user.twoFactor">
        <TextField name="two_factor_token"
            :label="$t('two factor token')"
            v-model="twoFactorToken.value"
            :placeholder="$t('enter your two factor token')"
            :autofocus="true"
            :validation="$v.twoFactorToken.value"
            @input="$v.twoFactorToken.value.$touch()" />

        <div class="buttons is-centered">
            <button type="button" class="button cf"
                v-if="app.session.available.length"
                @click="selectSession()">
                {{$t('change session')}}
            </button>
            <button type="button" class="button is-primary cf"
                :class="{'is-loading': user.status === 'login'}"
                :disabled="$v.$invalid || user.status === 'login'"
                @click="login">
                {{$t('log in')}}
            </button>
        </div>
    </div>

    <!-- Login without any sessions, or when selecting a new session.-->
    <div v-else-if="!app.session.available.length || app.session.active === 'new' || user.status === 'login'">

        <TextField v-if="!settings.webrtc.account.selection" name="endpoint"
            :label="$t('SIP websocket domain')"
            v-model="settings.webrtc.endpoint.uri"
            :help="$t('SIP provider with support for SIP over websockets and WebRTC.')"
            :placeholder="$t('e.g. websocket.my-sip-provider.tld')" />

        <!-- Only show the username field with a 'new' session. -->
        <TextField name="username"
            :label="$t('username')"
            v-model="user.username"
            :placeholder="$t('enter your email address')"
            :autofocus="true"
            :validation="$v.user.username"
            @input="$v.user.username.$touch()" />

        <PasswordField name="password"
            :label="$t('password')"
            v-model="password"
            :placeholder="$t('enter your password')"
            :validation="$v.password"
            @input="$v.password.$touch()" />

        <div class="buttons is-centered">
            <button  type="button" class="button cf"
                v-if="app.session.available.length"
                :disabled="user.status === 'login'"
                @click="selectSession()">
                {{$t('change session')}}
            </button>
            <button type="button" class="button is-primary cf test-login-button"
                :class="{'is-loading': user.status === 'login'}"
                :disabled="$v.$invalid || user.status === 'login'"
                @click="login">
                {{$t('log in')}}
            </button>
        </div>
    </div>

    <!-- Unlocking a selected session..-->
    <div v-else-if="app.session.active && app.session.active !== 'new'">
        <!-- Do not publish browser test screenshots without a password field. This would leak test credentials. -->
        <PasswordField name="password"
            :label="$t('password')"
            v-model="password"
            :placeholder="$t('enter your password')"
            :autofocus="true"
            :validation="$v.password"
            @input="$v.password.$touch()" />

        <div class="buttons is-centered">
            <button type="button" class="button cf"
                v-if="app.session.available.length"
                :disabled="user.status === 'login'"
                @click="selectSession()">
                {{$t('change session')}}
            </button>
            <button type="button" class="button is-primary cf test-login-button"
                :class="{'is-loading': user.status === 'login'}"
                :disabled="$v.$invalid || user.status === 'login'"
                @click="login">
                {{$t('log in')}}
            </button>
        </div>
    </div>

    <!-- Session picker that presents available sessions to choose from.-->
    <div class="sessions" v-else-if="app.session.available.length && !app.session.active">
        <div v-for="session in app.session.available" class="session">
            <i class="icon-session" @click="selectSession(session)"><icon name="user"/></i>
            <div class="description" @click="selectSession(session)">{{session}}</div>
            <i class="icon-remove status-indicator tooltip tooltip-left"
                :data-tooltip="$t('remove session').capitalize()"
                @click="removeSession(session)">
                <icon name="close"/>
            </i>
        </div>
        <div class="new-session-text cf">
            {{$t('or login with a different account')}}:
        </div>
        <div class="session new-session" @click="newSession()">
            <i class="icon-session"><icon class="icon-session" name="plus"/></i>
            <div class="description cf">{{$t('new session')}}</div>
        </div>
    </div>

    <footer>
        <div v-if="account.selection" class="forgot-pw">
            <a :href="`${url}/user/password_reset/`" class="cf" target="_blank">{{$t('forgot your password?')}}</a>
        </div>
        <div class="help-message cf">
            {{$t('need help?')}}<br/>
            <span class="cf">{{$t('click on the')}}</span>
            <i @click="setOverlay('about')"><icon name="help"/></i>{{$t('icon')}}
        </div>
    </footer>
</component>
