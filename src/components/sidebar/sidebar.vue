<div class="sidebar-component">
    <div class="option" :class="{active: layer === 'availability'}" @click="setLayer('availability')">
         <i class="fa fa-phone-square"></i>
    </div>
    <div class="option" :class="{active: layer === 'contacts'}" @click="setLayer('contacts')">
         <i class="fa fa-user"></i>
    </div>
    <div class="option" :class="{active: layer === 'queues'}" @click="setLayer('queues')">
         <i class="fa fa-users"></i>
    </div>
    <div class="option" :class="{active: layer === 'settings'}" @click="setLayer('settings')">
         <i class="fa fa-cog"></i>
    </div>
    <div class="option" :class="{active: layer === 'calldialog'}" @click="setLayer('calldialog')">
         <i class="fa fa-th"></i>
    </div>
</div>
