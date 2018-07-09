<component class="component-queues no-padding">

    <div class="panel-content">
        <h1 class="uc">{{$t('queue')}} {{$t('callgroups')}}</h1>

        <ul class="queues-list">
            <li class="queue" :class="{selected: selected.id == queue.id}" v-for="queue in queues" v-on:click="toggleActiveQueue(queue)">
                <div class="status-icon">
                    <i class="indicator" :class="classesQueue(queue)">{{queue.queue_size}}</i>
                </div>
                <div class="info">
                    <div class="name">{{queue.description}}</div>
                    <div class="description">{{queue.internal_number}}</div>
                </div>

                <div class="queues-options list-item-options">
                    <icon name="check" class="icon-selected-queue" v-if="selected.id == queue.id"/>
                    <div class="rounded-button" v-on:click.once="createCall(queue.internal_number)" v-if="transferStatus === 'select' && !numbersOngoing.includes(queue.internal_number)">
                        <icon name="transfer"/>
                    </div>
                </div>
            </li>

            <li class="list-item queue" v-if="status === 'loading'">
                <div class="status-icon">
                    <icon class="spinner" name="spinner"/>
                </div>
                <div class="info">
                    <div class="name cf">{{$t('loading queue callgroups')}}...</div>
                </div>
            </li>
            <li class="list-item queue" v-else-if="!queues.length">
                <div class="status-icon">
                    <i class="icon icon-queues"></i>
                </div>
                <div class="info">
                    <div class="name">{{$t('no {target} found', {target: `${$t('queue')} ${$t('callgroups')}`})}}...</div>
                    <div class="description"></div>
                </div>
            </li>
        </ul>
        <!-- Fill up some space by suggesting to add another queue -->
        <div class="notification-box info" v-if="queues.length <= 1">
            <header>
                <icon name="info"/>
                <span class="cf">{{$t('adding more queue callgroups')}}</span>
            </header>
            <div class="description cf">
                {{$t('you have {count} queue callgroup configured. ::: you have {count} queue callgroups configured.', {count: queues.length}, queues.length)}}
            </div>
            <ul>
                <li>{{$t('head over to')}} <a class="cf" @click="openPlatformUrl('callgroup')">{{$t('callgroups')}}</a> {{$t('to manage your {target}', {target: $t('callgroups')})}}.</li>
                <li>{{$t('head over to')}} <a class="cf" @click="openPlatformUrl('callgroup')">{{$t('queues')}}</a> {{$t('to manage your {target}', {target: $t('queues')})}}.</li>
                <li>{{$t('head over to')}} <a class="cf" @click="openPlatformUrl('routing')">{{$t('dialplans')}}</a> {{$t('to add the {source} to a {target}', {source: $t('queue'), target: $t('dialplan')})}}.</li>
            </ul>
        </div>
    </div>

</component>
