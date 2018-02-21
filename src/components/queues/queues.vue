<div class="queues-component no-padding">

    <div class="panel-content">
        <h1>{{$t('Queue')}} {{$t('callgroups')}}</h1>
    </div>

    <ul class="list-items">
        <li class="list-item queue" :class="{selected: selected.id == queue.id}" v-for="queue in queues" v-on:click="toggleActiveQueue(queue)">
            <div class="status-icon">
                <i class="indicator" :class="classesQueue(queue)">{{queue.queue_size}}</i>
            </div>
            <div class="info">
                <div class="name">{{queue.description}}</div>
                <div class="description">{{queue.internal_number}}</div>
            </div>

            <div class="queues-options list-item-options">
                <svgicon name="check" class="icon-selected-queue" v-if="selected.id == queue.id"/>
                <div class="rounded-button" v-on:click.once="createCall(queue.internal_number)" v-if="transferStatus === 'select' && !numbersOngoing.includes(queue.internal_number)">
                    <svgicon name="transfer"/>
                </div>
            </div>
        </li>

        <li class="list-item queue" v-if="state === 'loading'">
            <div class="status-icon">
                <svgicon class="spinner" name="spinner"/>
            </div>
            <div class="info">
                <div class="name">{{$t('Loading')}}...</div>
            </div>
        </li>
        <li class="list-item queue" v-else-if="!queues.length">
            <div class="status-icon">
                <i class="icon icon-queues"></i>
            </div>
            <div class="info">
                <div class="name">{{$t('No {target} found', {target: `${$t('queue')} ${$t('callgroups')}`})}}...</div>
                <div class="description"></div>
            </div>
        </li>
    </ul>
    <!-- Fill up some space by suggesting to add another queue -->
    <div class="platform-hint" v-if="queues.length <= 1">
        {{$t('You have {count} queue callgroup configured. ::: You have {count} queue callgroups configured.', {count: queues.length}, queues.length)}} {{$t('To add more:')}}
        <ul class="decorated-list">
            <li>{{$t('Head over to')}} <a @click="openPlatformUrl('callgroup')">{{$t('Callgroups')}}</a> {{$t('to manage your {target}', {target: $t('callgroups')})}}.</li>
            <li>{{$t('Head over to')}} <a @click="openPlatformUrl('callgroup')">{{$t('Queues')}}</a> {{$t('to manage your {target}', {target: $t('queues')})}}.</li>
            <li>{{$t('Head over to')}} <a @click="openPlatformUrl('routing')">{{$t('Dialplans')}}</a> {{$t('to add the {source} to a {target}', {source: $t('queue'), target: $t('dialplan')})}}.</li>
        </ul>
    </div>

    <div class="unauthorized-warning hide">{{$t('You are not authorized to monitor any queues you might have.')}}</div>
</div>
