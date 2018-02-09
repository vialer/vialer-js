<div class="sidebar-component">
    <div class="option availability" :class="{active: layer === 'availability'}" @click="setLayer('availability')">
         <i class="icon-availability"></i>
    </div>

    <div class="option contacts" :class="{active: layer === 'contacts', hint: transferStatus === 'select'}" @click="setLayer('contacts')">
         <i class="icon icon-contacts"></i>
    </div>
    <div class="option queues" :class="{active: layer === 'queues', hint: transferStatus === 'select'}" @click="setLayer('queues')">
         <i class="icon-queues"></i>
    </div>

    <div class="option calls" :class="{active: layer === 'calls', 'calls-active': this.callsActive}" @click="setLayer('calls')">
         <i class="icon icon-dialpad"></i>
    </div>
</div>
