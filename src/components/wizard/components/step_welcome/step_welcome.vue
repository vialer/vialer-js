<component class="component-step-welcome">
    <header>{{greeting}}</header>

    <div class="step-description cf">
        {{$t('welcome to your')}} {{app.name}}.<br/>
        <span class="cf">{{$t('you can now receive, transfer and create calls straight from your browser.')}}</span><br/>
        <span class="cf">{{$t('let\'s get you set up!')}}</span>
    </div>

    <slot name="progress"></slot>
</component>
