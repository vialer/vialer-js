<component class="component-mic-permission">
    <div class="field">
        <template v-if="settings.webrtc.media.permission">
            <!-- Additional help to guide the user to the browser permission settings. -->
            <div class="mic-popout-instructions" v-if="soundmeter">
                <div class="help cf">{{$t('check if the microphone responds to your voice.')}}</div>
                <Soundmeter class="soundmeter"/>
            </div>
            <div class="mic-popout-instructions" v-else>
                <icon name="video-cam" class="video-cam"/>
                <i class="check"><icon name="check"/></i>
                <div class="help cf">{{$t('the browser already has permission to use your computer\'s microphone.')}}</div>
            </div>
        </template>

        <!-- Give the user instructions how to enable the microphone in the popout -->
        <div class="mic-popout-instructions" v-else-if="!settings.webrtc.media.permission && env.isPopout">
            <icon name="video-cam-disabled" class="video-cam"/>
            <p>
                <span class="cf">{{$t('inspect the browser navigation bar for microphone access.')}}</span>
                <span class="cf">{{$t('close this tab afterwards.')}}</span>
            </p>
        </div>

        <span v-if="!settings.webrtc.media.permission && !env.isPopout">
            <div class="mic-popout-notice cf">{{$t('this action will open a new tab to display the request.')}}</div>
            <a class="button is-primary" @click="openPopoutView">
                <span class="icon is-small"><icon name="microphone"/></span>
                <span class="cf">{{$t('give permission')}}</span>
            </a>
        </span>
    </div>
</component>
