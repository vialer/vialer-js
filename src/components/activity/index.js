module.exports = (app) => {

    return {
        computed: {
            filteredActivity: function() {
                let activity = this.activity.sort(app.utils.sortByMultipleKey(['date'], -1))
                if (this.filters.reminders) activity = activity.filter((i) => i.remind)
                if (this.filters.missed) activity = activity.filter((i) => (i.label === 'missed' || i.label === 'unanswered'))
                return activity
            },
        },
        methods: Object.assign({
            callRecent: function(recent) {
                if (recent.contact) {
                    this.createCall(this.contacts[recent.contact].endpoints[recent.endpoint].number)
                } else {
                    this.createCall(recent.number)
                }
            },
            classes: function(block, modifier) {
                let classes = {}
                if (block === 'recent-status') {
                    classes[modifier.status] = true
                } else if (block === 'remind-button') {
                    if (modifier.remind) classes.active = true
                } else if (block === 'filter-missed-calls') {
                    if (this.filters.missed) classes['active-red'] = true
                } else if (block === 'filter-reminders') {
                    if (this.filters.reminders) classes['active-yellow'] = true
                }
                return classes
            },
            toggleFilterMissedCalls: function() {
                app.setState({activity: {filters: {missed: !app.state.activity.filters.missed}}}, {persist: true})
            },
            toggleFilterReminders: function() {
                app.setState({activity: {filters: {reminders: !app.state.activity.filters.reminders}}}, {persist: true})
            },
            toggleReminder: function(activity) {
                activity.remind = !activity.remind
                app.setState(activity, {path: `activity.activity.${this.activity.findIndex(i => i.id === activity.id)}`, persist: true})
            },
        }, app.helpers.sharedMethods()),
        mounted: function() {
            // Mark activity as read as soon the component is opened.
            app.setState({activity: {unread: false}}, {persist: true})
        },
        render: templates.activity.r,
        staticRenderFns: templates.activity.s,
        store: {
            activity: 'activity.activity',
            contacts: 'contacts.contacts',
            filters: 'activity.filters',
            tabs: 'ui.tabs.activity',
            user: 'user',
        },
    }
}
