<component class="component-mic-permission">
    <div class="field">
        <template v-if="settings.webrtc.media.permission">
            <!-- Additional help to guide the user to the browser permission settings. -->
            <div class="mic-popout-instructions" v-if="soundmeter">
                <div class="help">{{$t('Check if the microphone responds to your voice.')}}</div>
                <Soundmeter class="soundmeter"/>
            </div>
            <div class="mic-popout-instructions" v-else>
                <icon name="video-cam" class="video-cam"/>
                <i class="check"><icon name="check"/></i>
                <div class="help">{{$t('The browser already has permission to use your computer\'s microphone.')}}</div>
            </div>
        </template>

        <!-- Give the user instructions how to enable the microphone in the popout -->
        <div class="mic-popout-instructions" v-else-if="!settings.webrtc.media.permission && env.isPopout">
            <icon name="video-cam-disabled" class="video-cam"/>
            <p>
                {{$t('Inspect the browser navigation bar for microphone access.')}}
                {{$t('Close this tab afterwards.')}}
            </p>
        </div>

        <span v-if="!settings.webrtc.media.permission && !env.isPopout">
            <div class="mic-popout-notice">{{$t('This action will open a new tab to display the request.')}}</div>
            <a class="button is-primary" @click="openPopoutView">
                <span class="icon is-small"><icon name="microphone"/></span>
                <span>{{$t('Give permission')}}</span>
            </a>
        </span>
    </div>
</component>
