module.exports = function(app) {
    /**
    * @memberof fg.components
    */
    const Notifications = {
        methods: {
            classes: function(block, notification) {
                let cssClasses = {}
                if (block === 'notification') cssClasses[`is-${notification.type}`] = true
                return cssClasses
            },
            close: function(notification) {
                let notifications = this.notifications.filter((i) => i.id !== notification.id)
                app.setState({app: {notifications}})
            },
        },
        props: ['notification'],
        render: templates.notifications.r,
        staticRenderFns: templates.notifications.s,
        store: {
            notifications: 'app.notifications',
        },
    }

    return Notifications
}
