<div class="sidebar-component">
    <div class="option" :class="{active: layer === 'availability'}" @click="setLayer('availability')">
         <i class="icon-availability"></i>
    </div>

    <div class="option" :class="{active: layer === 'contacts', hint: transferStatus === 'select'}" @click="setLayer('contacts')">
         <i class="icon icon-contacts"></i>
    </div>
    <div class="option" :class="{active: layer === 'queues', hint: transferStatus === 'select'}" @click="setLayer('queues')">
         <i class="icon-queues"></i>
    </div>

    <div class="option" :class="{active: layer === 'calls', hint: Object.keys(calls).length > 0}" @click="setLayer('calls')">
         <i class="icon icon-dialpad"></i>
    </div>
</div>
