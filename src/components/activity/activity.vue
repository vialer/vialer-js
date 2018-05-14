<component class="component-activity">

    <div class="panel-content">
        <header>
            <div class="header-line">
                <h1 class="uc">{{$t('activity')}}</h1>
                <div class="vertical-devider"></div>
                <div class="content-filters">
                    <div class="filter cf" :class="classes('filter-missed-calls')" @click="toggleFilterMissedCalls()">
                        <icon name="missed-call"/>
                        {{$t('missed')}}
                    </div>
                    <div class="filter cf" :class="classes('filter-reminders')" @click="toggleFilterReminders()">
                        <icon name="idea"/>
                        {{$t('reminders')}}
                    </div>
                </div>
            </div>
        </header>

        <div class="activity" v-for="activity of filteredActivity">
            <div class="activity-icon" :class="classes('recent-status', activity)">
                <icon :name="activity.type"/>
            </div>
            <div class="activity-info">
                <header v-if="activity.contact">
                    {{contacts[activity.contact].name}}
                </header>
                <header v-else>{{activity.number}}</header>
                <footer>{{activity.date | fuzzydate}}</footer>
            </div>
            <div class="activity-label" v-if="activity.label">
                <span>{{$t(activity.label)}}</span>
            </div>

            <div class="item-slider">
                <div class="item-slider-option green cf" v-on:click="callRecent(activity)">
                    {{$t('call')}}
                    <icon name="phone-circle"/>
                </div>
                <div class="item-slider-option grey cf" :class="classes('remind-button', activity)" v-on:click="toggleReminder(activity)">
                    {{$t('reminder')}}
                    <icon name="star-circle"/>
                </div>
            </div>
        </div>

        <div class="no-results" v-if="!filteredActivity.length">
            <icon class="no-results-icon" name="recent"/>
            <div class="no-results-text">{{$t('no {target} found', {target: $t('activity')})}}...</div>
        </div>
    </div>
</component>
