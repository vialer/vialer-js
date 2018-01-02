<div class="widget queues" :class="widgetState">

    <div class="widget-header" v-on:click="toggleActive('queues')">
        <div class="widget-header-icons">
            <i class="widget-icon icon-queue"></i>
            <i class="busy-icon icon-refresh icon-spin"></i>
            <i class="unauthorized-icon icon-warning hide"></i>
        </div>

        <div class="widget-header-text">{{$t('Queues')}}</div>
        <span class="status-indicators"></span>
    </div>

    <div class="widget-content">
        <ul class="widget-item-list list">
            <li class="widget-item queue" :class="{selected: module.selectedQueue == queue.id}" v-for="queue in module.queues" v-on:click="activateQueue(queue)">
                <div class="icon"><i class="indicator">{{queue.queue_size}}</i></div>
                <div class="info">
                    <div class="name">{{queue.description}}</div>
                    <div class="description">{{queue.internal_number}}</div>
                </div>
            </li>

            <li class="widget-item queue" v-if="!module.queues.length">
                <div class="icon"><i class="indicator"></i></div>
                <div class="info">
                    <div class="name">{{$t('No queues available')}}</div>
                    <div class="description"></div>
                </div>
            </li>
        </ul>
    </div>

    <div class="unauthorized-warning hide">{{$t('You are not authorized to monitor any queues you might have.')}}</div>
</div>
