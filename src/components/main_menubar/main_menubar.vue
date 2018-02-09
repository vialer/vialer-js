<div class="main-menubar-component">
    <div class="option availability" :class="classes('availability')" @click="setLayer('availability')">
         <i class="icon-availability" :class="{}"></i>
    </div>

    <div class="option contacts" :class="classes('contacts')" @click="setLayer('contacts')">
         <i class="icon icon-contacts"></i>
    </div>
    <div class="option queues" :class="classes('queues')" @click="setLayer('queues')">
         <i class="icon-queues"></i>
    </div>

    <div class="option calls" :class="classes('calls')" @click="setLayer('calls')">
         <i class="icon icon-dialpad"></i>
    </div>
</div>
