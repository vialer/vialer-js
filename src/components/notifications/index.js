module.exports = function(app) {
    /**
    * @memberof fg.components
    */
    const Notifications = {
        methods: {
            classes: function(block, notification) {
                let classes = {}
                if (block === 'notification') {
                    classes[`is-${notification.type}`] = true
                } else if (block === 'component') {
                    if (this.user.authenticated) classes.topbar = true
                }
                return classes
            },
            close: function(notification) {
                let notifications = this.notifications.filter((i) => i.id !== notification.id)
                app.setState({app: {notifications}})
            },
            openUrl: function(url) {
                if (app.env.isExtension) browser.tabs.create({url})
                else window.open(url, '_blank')
            },
        },
        props: ['notification'],
        render: templates.notifications.r,
        staticRenderFns: templates.notifications.s,
        store: {
            notifications: 'app.notifications',
            user: 'user',
        },
    }

    return Notifications
}
