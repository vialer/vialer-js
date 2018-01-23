<div class="sidebar-component">
    <div class="option" :class="{active: layer === 'availability'}" @click="setLayer('availability')">
         <i class="icon-availability"></i>
    </div>
    <div class="option" :class="{active: layer === 'contacts'}" @click="setLayer('contacts')">
         <i class="fa icon-entity"></i>
    </div>
    <div class="option" :class="{active: layer === 'queues'}" @click="setLayer('queues')">
         <i class="fa icon-queue"></i>
    </div>
    <div class="option" :class="{active: layer === 'calldialog'}" @click="setLayer('calldialog')">
         <i class="fa fa-th"></i>
    </div>
</div>
