/**
* @module ModuleApp
*/
const Module = require('../lib/module')

class ModuleApp extends Module {

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
                portal: {
                    name: process.env.PORTAL_NAME,
                    url: process.env.PORTAL_URL,
                },
                support: {
                    email: process.env.VENDOR_SUPPORT_EMAIL,
                    phone: process.env.VENDOR_SUPPORT_PHONE,
                    website: process.env.VENDOR_SUPPORT_WEBSITE,
                },
                type: process.env.VENDOR_TYPE,
            },
            version: {
                current: process.env.VERSION,
                previous: process.env.VERSION,
            },
        }
    }


    _restoreState(moduleStore) {
        moduleStore.notifications = []
    }
}

module.exports = ModuleApp
