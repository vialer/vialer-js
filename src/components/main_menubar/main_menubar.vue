<component class="component-main-menubar">

    <div class="options">
        <div class="option calls test-menubar-calls" :class="classes('calls')" @click="setLayer('calls')" role="button" :aria-labelledby="$t('dialpad')">
             <icon name="dialpad"/>
        </div>

        <div class="option activity test-menubar-activity" :class="classes('activity')" @click="setLayer('activity')" role="button" :aria-labelledby="$t('recent activity')">
            <icon name="recent"/>
        </div>

        <div class="option contacts test-menubar-contacts" :class="classes('contacts', true)" @click="setLayer('contacts')" role="button" :aria-labelledby="$t('contacts')">
            <icon name="contacts"/>
        </div>

        <div class="option availability test-menubar-availability" :class="classes('availability')" @click="setLayer('availability')" role="button" :aria-labelledby="$t('availability')">
            <icon name="availability"/>
        </div>

        <div v-if="plugin.menubarIcon" class="option" :class="classes(plugin.menubarIcon, plugin.menubarTransferHint)"
            v-for="plugin in customPlugins" @click="setLayer(plugin.menubarIcon)"
            role="button" :aria-labelledby="plugin.name">
            <icon :name="plugin.menubarIcon"/>
        </div>
    </div>

    &nbsp;
</component>
