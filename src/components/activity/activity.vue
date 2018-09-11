<component class="component-activity padded">

    <header>
        <div class="header-line">
            <h1 class="uc">{{$t('activity')}}</h1>
            <div class="vertical-devider"></div>
            <div class="content-filters">
                <div class="filter" :class="classes('filter-reminders')" @click="toggleFilterReminders()">
                    <icon name="idea"/>
                    <span class="cf">{{$t('reminders')}}</span>
                </div>
                <div class="filter" :class="classes('filter-missed-calls')" @click="toggleFilterMissedCalls()">
                    <icon name="missed-call"/>
                    <span class="cf">{{$t('missed')}}/<span class="cf">{{$t('unanswered')}}</span></span>
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
                <button class="item-option grey" :class="classes('remind-button', activity)" v-on:click="toggleReminder(activity)">
                    <icon name="idea"/>
                </button>
                <button class="item-option green" v-on:click="callRecent(activity)">
                    <icon name="phone-circle"/>
                </button>
            </div>
        </div>
    </div>
</component>
