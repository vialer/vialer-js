<div class="main-menubar-component">

    <div class="option availability" :class="classes('availability')" @click="setLayer('availability')">
        <svgicon name="availability"/>
    </div>

    <div class="option contacts" :class="classes('contacts')" @click="setLayer('contacts')">
        <svgicon name="contacts"/>
    </div>
    <div class="option queues" :class="classes('queues')" @click="setLayer('queues')">
        <svgicon name="queues"/>
    </div>

    <div class="option calls" :class="classes('calls')" @click="setLayer('calls')">
         <svgicon name="dialpad"/>
    </div>
</div>
