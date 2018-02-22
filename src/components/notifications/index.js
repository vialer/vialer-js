module.exports = function(app) {
    // Register as a plugin.
    Vue.use({
        install(Vue, options) {
            let idCounter = 0

            Vue.prototype.$notify = function(notification) {
                if (typeof notification.timeout === 'undefined') notification.timeout = 3000
                notification.id = idCounter
                idCounter += 1

                this.$store.notifications.push(notification)
                if (typeof notification.timeout === 'number' && notification.timeout > 0) {
                    setTimeout(() => {
                        this.$store.notifications = this.$store.notifications.filter((i) => i.id !== notification.id)
                    }, notification.timeout)
                }
            }
        },
    })

    return {
        methods: {
            classes: function(block, notification) {
                let cssClasses = {}
                if (block === 'notification') cssClasses[`is-${notification.type}`] = true
                return cssClasses
            },
            close: function(notification) {
                this.$store.notifications = this.$store.notifications.filter((i) => i.id !== notification.id)
            },
        },
        props: ['notification'],
        render: templates.notifications.r,
        staticRenderFns: templates.notifications.s,
        store: {
            notifications: 'notifications',
        },
    }
}
