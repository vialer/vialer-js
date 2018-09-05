require('module-alias/register')

const App = require('vialer-js/lib/app')
require('./i18n')

/**
* A minimal Vue-powered documentation website, reusing as much
* as possible from the Vialer-js source. Reason for building
* is that we want branded documentation, and a higher degree
* of control over how the documentation looks and is being
* generated. It is also a good testingground to optimize
* the App & Skeleton abstraction.
*/
class AppDocs extends App {

    constructor(options) {
        super(options)

        const components = {
            Sidebar: require('../components/sidebar'),
            ViewPage: require('../components/view_page'),
        }

        this.components = {}

        for (const name of Object.keys(components)) {
            this.components[name] = Vue.component(name, components[name](this))
        }

        Vue.component('VRuntimeTemplate', require('v-runtime-template/dist/v-runtime-template.cjs'))

        this.__initStore({
            app: {
                name: process.env.APP_NAME,
            },
            pages: global.pages,
            vendor: {
                name: process.env.VENDOR_NAME,
            },
            version: {
                current: process.env.VERSION,
            },
        })

        this.router = this.setupRouter()
        this.__loadPlugins(this.__plugins)

        this.__initViewModel({
            main: require('../components/main')(this),
            settings: {router: this.router},
        })

        this.vm.$mount('#app')
    }


    setupRouter() {
        Vue.use(VueRouter)

        const router = new VueRouter({
            base: '/',
            linkActiveClass: 'is-active',
            mode: 'history',
        })

        return router
    }
}

global.options = require('./lib/options')

global.AppDocs = AppDocs
module.exports = AppDocs
