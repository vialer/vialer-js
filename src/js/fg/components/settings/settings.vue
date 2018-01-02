<div class="options">
    <div class="field">
        <input id="c2d" type="checkbox" value="true" />
        <label for="c2d">{{$t('Click-to-Dial icons in websites')}}</label>
    </div>

    <div class="field">
        <input id="webrtc_enabled" type="checkbox" value="true" />
        <label for="webrtc_enabled">{{$t('WebRTC softphone')}}</label>
    </div>

    <div class="field">
        <input type="text" placeholder="SIP Server" />
    </div>


    <div class="field">
        <input type="text" placeholder="VoIP account name" />
    </div>

    <div class="field">
        <input type="password" placeholder="VoIP account password" />
    </div>

    <div class="field">
        <input id="platform_enabled" type="checkbox" value="true" />
        <label for="platform_enabled">{{$t('Use platform features')}}</label>
    </div>

    <div class="field">
        <label for="platformUrl">{{$t('Platform URL')}}</label>
        <input id="platform-url" type="text" placeholder="https://" />
        <p class="warning platform-warning hide">{{$t('You will be automatically logged out when changing this setting')}}</p>
    </div>

    <div class="actions">
        <button id="save" type="button">{{$t('Save')}}</button>
    </div>
</div>
