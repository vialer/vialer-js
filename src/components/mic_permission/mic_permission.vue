<component class="component-mic-permission">
    <div class="field">

        <div v-if="settings.webrtc.media.permission">
            <!-- Additional help to guide the user to the browser permission settings. -->
            <div class="mic-details">
                <div class="browser-bar video-cam-enabled">
                    <icon name="video-cam" class="video-cam"/>
                </div>

                <div class="permission-message cf">
                    <i class="icon check"><icon name="check"/></i>
                    <span class="cf">{{$t('the microphone is ready to use')}}</span><br/>
                </div>
            </div>
        </div>

        <div v-else class="mic-details popout">
            <div class="browser-bar video-cam-disabled">
                <icon name="video-cam-disabled" class="video-cam"/>
            </div>

            <div class="permission-message no-permission cf">
                <i class="icon"><icon name="info"/></i>
                <span class="cf">{{$t('no microphone access', {name: app.name})}}</span>
            </div>

            <span v-if="!env.isExtension || (env.isExtension && env.isPopout)" class="cf instruction">
                {{$t('click on the device access icon in the browser navigation bar to fix this. The icon looks similar to the one above.', {name: app.name})}}
            </span>
            <div v-else>
                <span class="cf instruction">
                    {{$t('click on the microphone access button to open {name} in a browser tab. The permission can be adjusted from there.', {name: app.name})}}
                </span>
                <button class="button" @click="openPopoutView">
                    <span class="icon is-small"><icon name="microphone"/></span>
                    <span class="cf">{{$t('microphone access')}}</span>
                </button>
            </div>

        </div>
    </div>
</component>
