<component class="component-calls" :class="classes('component')">
    <!-- There should always be a call active when viewing this component. -->
    <div class="calls-container">
        <!-- Don't notify about call inability until the calls module is done loading. -->
        <div class="disabled-placeholder" v-if="(callingDisabled && !callOngoing) && status !== 'loading'">
            <icon class="disabled-icon" name="dialpad-off"/>
            <div class="disabled-text">
                <span class="cf">{{$t('service unavailable.')}}</span><br/>
                <span class="cf">{{$t('what\'s wrong?')}}</span>
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
    <Soundmeter class="soundmeter"  v-if="(status === 'loading') || !callingDisabled"/>
</component>
