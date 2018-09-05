const Plugin = require('vialer-js/lib/plugin')

class PluginPage extends Plugin {

    constructor(app) {
        super(app)

        app.router.addRoutes([{
            component: app.components.ViewPage,
            name: 'view_quickstart',
            path: '/',
        }])

        app.router.addRoutes([{
            component: app.components.ViewPage,
            name: 'view_developer_topic',
            path: '/developer/:topic_id',
        }])

        app.router.addRoutes([{
            component: app.components.ViewPage,
            name: 'view_user_topic',
            path: '/user/:topic_id',
        }])
    }


    /**
    * Generate a representational name for this module. Used for logging.
    * @returns {String} - An identifier for this module.
    */
    toString() {
        return `${this.app}[app] `
    }
}


module.exports = PluginPage
