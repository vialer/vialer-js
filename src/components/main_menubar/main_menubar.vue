<component class="component-main-menubar">

    <div class="options">
        <div class="option calls" :class="classes('calls')" @click="setLayer('calls')">
             <icon name="dialpad"/>
        </div>

        <div class="option activity" :class="classes('activity')" @click="setLayer('activity')">
            <icon name="recent"/>
        </div>

        <div class="option contacts" :class="classes('contacts')" @click="setLayer('contacts')">
            <icon name="contacts"/>
        </div>

        <div class="option availability" :class="classes('availability')" @click="setLayer('availability')">
            <icon name="availability"/>
        </div>

        <div class="option queues" :class="classes('queues')" @click="setLayer('queues')">
            <icon name="queues"/>
        </div>
    </div>
</component>
