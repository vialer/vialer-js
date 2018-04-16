<component class="component-activity">

    <div class="panel-content">
        <header>
            <h1>{{$t('Activity')}}</h1>
            <div class="vertical-devider"></div>
            <div class="content-filters">
                <div class="filter" :class="classes('filter-missed-calls')" @click="toggleFilterMissedCalls()">
                    <icon name="missed-call"/>
                    {{$t('Missed')}}
                </div>
                <div class="filter" :class="classes('filter-reminders')" @click="toggleFilterReminders()">
                    <icon name="idea"/>
                    {{$t('Reminders')}}
                </div>
            </div>
        </header>

        <div class="recent" v-for="recent of filteredRecents">
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

        <div class="no-results" v-if="!filteredRecents.length">
            <icon class="no-results-icon" name="recent"/>
            <div class="no-results-text">{{$t('No {target} found', {target: $t('activity')})}}...</div>
        </div>
    </div>
</component>
