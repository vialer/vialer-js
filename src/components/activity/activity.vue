<component class="component-activity padded">

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

    <div class="item-list">
        <div class="no-results-indicator" v-if="!filteredActivity.length">
            <div><icon name="recent"/></div>
            <div class="text cf">{{$t('no {target}', {target: $t('activity')})}}...</div>
        </div>

        <div v-else class="activity item" v-for="activity of filteredActivity">
            <div class="activity-icon" :class="classes('recent-status', activity)">
                <icon :name="activity.type"/>
            </div>
            <div class="activity-info">
                <div class="name" v-if="activity.contact">
                    {{contacts[activity.contact].name}}
                </div>
                <div class="name" v-else>{{activity.number}}</div>
                <div class="description">{{activity.date | fuzzydate}}</div>
            </div>
            <div class="activity-label" v-if="activity.label">
                <span>{{$t(activity.label)}}</span>
            </div>

            <div class="item-options">
                <div class="item-option green cf" v-on:click="callRecent(activity)">
                    <icon name="phone-circle"/>
                </div>
                <div class="item-option grey cf" :class="classes('remind-button', activity)" v-on:click="toggleReminder(activity)">
                    <icon name="star-circle"/>
                </div>
            </div>
        </div>
    </div>
</component>
