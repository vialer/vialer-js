const Module = require('./lib/module')

/**
* @module App
*/
class AppModule extends Module {

    constructor(...args) {
        super(...args)

        if (this.app.env.isBrowser) {
            window.addEventListener('offline', (e) => {
                this.app.setState({app: {online: false}})
            })
            window.addEventListener('online', (e) => {
                this.app.setState({app: {online: true}})
            })
        }

    }


    _initialState() {
        return {
            installed: true,
            name: process.env.APP_NAME,
            notifications: [],
            online: true,
            updated: false,
            vendor: {
                name: process.env.VENDOR_NAME,
                support: process.env.VENDOR_SUPPORT,
                type: process.env.VENDOR_TYPE,
            },
            version: {
                current: process.env.VERSION,
                previous: process.env.VERSION,
            },
        }
    }


    _hydrateState(moduleStore) {
        moduleStore.notifications = []
    }
}

module.exports = AppModule
