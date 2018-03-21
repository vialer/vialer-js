<component class="component-about">
    <div class="about">
        <div class="about-version">
            <svgicon name="logo" class="version-logo" :original="true"/>
            <div class="version-name">{{app.name}} {{app.version.current}}</div>
        </div>
    </div>
    <div class="support">
        <div class="support-option">
            <svgicon class="support-icon" name="logo"/>
            <div class="support-title">{{$t('Online help')}}</div>
            <div class="support-description">{{$t('Get help with')}} {{app.name}}:</div>
            <div class="support-channel link" @click="openTab(vendor.support.website)">{{vendor.name}} website</div>
        </div>

        <div class="support-option">
            <svgicon class="support-icon" name="mail"/>
            <div class="support-title">{{$t('E-mail')}}</div>
            <div class="support-description">{{$t('Drop us your question at')}}:</div>
            <div class="support-channel"><a :href="'mailto:' + vendor.support.email">{{vendor.support.email}}</a></div>
        </div>

        <div class="support-option">
            <svgicon class="support-icon" name="phone"/>
            <div class="support-title">{{$t('Phone')}}</div>
            <div class="support-description">{{$t('Give us a call')}}:</div>
            <div class="support-channel link" @click="createCall(vendor.support.phone)">{{vendor.support.phone}}</div>
        </div>

        <div class="support-option">
            <svgicon class="support-icon" name="github"/>
            <div class="support-title">{{$t('Github')}}</div>
            <div class="support-description">{{$t('Report an issue')}}:</div>
            <div class="support-channel link" @click="openTab('https://github.com/voipgrid/vialer-js/issues')">Github issues</div>
        </div>
    </div>
</component>
