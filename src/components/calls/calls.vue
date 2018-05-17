<component class="component-calls" :class="classes('component')">
    <!-- There should always be a call active when viewing this component. -->
    <div class="calls-container">
        <div class="disabled-placeholder" v-if="callingDisabled && !callOngoing">
            <icon class="disabled-icon" name="dialpad-off"/>
            <div class="disabled-text">
                <span class="cf">{{$t('calling is momentarily disabled.')}}</span>
                <span class="cf">{{$t('possible reason')}}:</span>
            </div>
            <div class="disabled-reason">
                <ul>
                    <li v-for="reason in callingDisabled">
                        {{translations('callingDisabled', reason)}}
                    </li>
                </ul>
            </div>
        </div>
        <Call v-else-if="activeCall" :call="activeCall"/>
        <CallSwitch v-if="callOngoing" :call="activeCall"/>
    </div>
    <Soundmeter class="soundmeter"  v-if="!callingDisabled"/>
</component>
