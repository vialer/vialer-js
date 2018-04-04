module.exports = (app) => {

    return {
        computed: {
            sortedRecents: function() {
                return this.activity.sort(app.utils.sortByMultipleKey(['date'], -1))
            },
            sortedReminders: function() {
                return this.activity.filter((i) => i.remind)
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
                }
                return classes
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
            tabs: 'ui.tabs.activity',
            user: 'user',
        },
    }
}
