<div class="queues-component no-padding">

    <div class="panel-content">
        <h1>{{$t('Queues')}}</h1>
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

            <div class="queues-options">
                <div class="rounded-button" v-if="transferStatus === 'select' && !numbersOngoing.includes(queue.internal_number)">
                    <i class="icon icon-transfer" v-on:click.once="transferActivate(queue.internal_number)"></i>
                </div>
            </div>
        </li>

        <li class="list-item queue" v-if="!queues.length">
            <div class="icon"><i class="indicator"></i></div>
            <div class="info">
                <div class="name">{{$t('No queues available')}}</div>
                <div class="description"></div>
            </div>
        </li>
    </ul>

    <div class="unauthorized-warning hide">{{$t('You are not authorized to monitor any queues you might have.')}}</div>
</div>
