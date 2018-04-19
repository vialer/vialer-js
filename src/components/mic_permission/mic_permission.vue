<component class="component-mic-permission">
    <div class="field">
        <template v-if="settings.webrtc.media.permission">
            <!-- Additional help to guide the user to the browser permission settings. -->
            <div class="mic-popout-instructions" v-if="soundmeter">
                {{$t('Check if the microphone responds to your voice.')}}
                <Soundmeter class="soundmeter"/>
            </div>
            <div class="mic-popout-instructions" v-else>
                <icon name="video-cam" class="video-cam"/>
                <p>{{$t('The browser has permission to use your microphone. No further action required.')}}</p>
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
