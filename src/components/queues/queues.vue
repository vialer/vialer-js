<div class="queues-component panel-content" :class="widgetState">

    <h1>{{$t('Queues')}}</h1>

    <ul class="list">
        <li class="list-item queue" :class="{selected: module.selectedQueue == queue.id}" v-for="queue in module.queues" v-on:click="activateQueue(queue)">
            <div class="icon"><i class="indicator">{{queue.queue_size}}</i></div>
            <div class="info">
                <div class="name">{{queue.description}}</div>
                <div class="description">{{queue.internal_number}}</div>
            </div>
        </li>

        <li class="list-item queue" v-if="!module.queues.length">
            <div class="icon"><i class="indicator"></i></div>
            <div class="info">
                <div class="name">{{$t('No queues available')}}</div>
                <div class="description"></div>
            </div>
        </li>
    </ul>

    <div class="unauthorized-warning hide">{{$t('You are not authorized to monitor any queues you might have.')}}</div>
</div>
