<component class="component-activity">

    <div class="tabs tabs-squeezed">
        <ul>
            <li :class="{'is-active': tabs.active === 'recent'}" @click="setTab('activity', 'recent')">
                <a><span class="icon is-small"><icon name="recent"/></span><span>{{$t('Activity')}}</span></a>
            </li>
            <li :class="{'is-active': tabs.active === 'reminders'}" @click="setTab('activity', 'reminders')">
                <a><span class="icon is-small"><icon name="star-circle"/></span><span>{{$t('Reminders')}}</span></a>
            </li>
        </ul>
    </div>

    <div class="tab" :class="{'is-active': tabs.active === 'recent'}">
        <div class="recent" v-for="recent of sortedRecents">
            <div class="recent-icon" :class="classes('recent-status', recent)">
                <icon :name="recent.type"/>
            </div>
            <div class="recent-info">
                <header v-if="recent.contact">
                    {{contacts[recent.contact].name}}
                </header>
                <header v-else>{{recent.number}}</header>
                <footer>{{recent.date | fuzzydate}}</footer>
            </div>
            <div class="recent-label" v-if="recent.label">
                <span>{{$t(recent.label)}}</span>
            </div>

            <div class="item-slider">
                <div class="item-slider-option green" v-on:click="callRecent(recent)">
                    {{$t('Call')}}
                    <icon name="phone-circle"/>
                </div>
                <div class="item-slider-option grey" :class="classes('remind-button', recent)" v-on:click="toggleReminder(recent)">
                    {{$t('Reminder')}}
                    <icon name="star-circle"/>
                </div>
            </div>
        </div>

        <div class="no-results" v-if="!sortedRecents.length">
            <icon class="no-results-icon" name="recent"/>
            <div class="no-results-text">{{$t('No {target} found', {target: $t('activity')})}}...</div>
        </div>

    </div>

    <div class="tab" :class="{'is-active': tabs.active === 'reminders'}">
        <div class="recent" v-for="recent of sortedReminders">
            <div class="recent-icon" :class="classes('recent-status', recent)">
                <icon :name="recent.type"/>
            </div>
            <div class="recent-info">
                <header v-if="recent.contact">
                    {{contacts[recent.contact].name}}
                </header>
                <header v-else>{{recent.number}}</header>
                <footer>{{recent.date | fuzzydate}}</footer>
            </div>
            <div class="recent-label" v-if="recent.label">
                <span>{{$t(recent.label)}}</span>
            </div>

            <div class="item-slider">
                <div class="item-slider-option green" v-on:click="callRecent(recent)">
                    {{$t('Call')}}
                    <icon name="phone-circle" color="url(#svgicon-tab2-phone-circle)"/>
                </div>
                <div class="item-slider-option grey" :class="classes('remind-button', recent)" v-on:click="toggleReminder(recent)">
                    {{$t('Reminder')}}
                    <icon name="star-circle" color="url(#svgicon-tab2-star-circle)"/>
                </div>
            </div>
        </div>

        <div class="no-results" v-if="!sortedReminders.length">
            <icon class="no-results-icon" name="recent"/>
            <div class="no-results-text">{{$t('No {target} found', {target: $t('reminders')})}}...</div>
        </div>
    </div>
</component>
