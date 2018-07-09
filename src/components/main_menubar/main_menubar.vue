<component class="component-main-menubar">

    <div class="options">
        <div class="option calls test-menubar-calls" :class="classes('calls')" @click="setLayer('calls')">
             <icon name="dialpad"/>
        </div>

        <div class="option activity test-menubar-activity" :class="classes('activity')" @click="setLayer('activity')">
            <icon name="recent"/>
        </div>

        <div class="option contacts test-menubar-contacts" :class="classes('contacts', true)" @click="setLayer('contacts')">
            <icon name="contacts"/>
        </div>

        <div class="option availability test-menubar-availability" :class="classes('availability')" @click="setLayer('availability')">
            <icon name="availability"/>
        </div>

        <div v-if="module.menubarIcon" class="option" :class="classes(module.menubarIcon, module.menubarTransferHint)" v-for="module in customPlugins" @click="setLayer(module.menubarIcon)">
            <icon :name="module.menubarIcon"/>
        </div>
    </div>

    &nbsp;
</component>
