let env = require('../lib/env')

const Api = require('./lib/api')
const Sip = require('./lib/sip')
const Skeleton = require('../lib/skeleton')
const Telemetry = require('./lib/telemetry')
const Timer = require('./lib/timer')


const _modules = [
    {Module: require('./availability'), name: 'availability'},
    {Module: require('./contacts'), name: 'contacts'},
    {Module: require('./dialer'), name: 'dialer'},
    {Module: require('./ui'), name: 'ui'},
    {Module: require('./user'), name: 'user'},
    {Module: require('./queues'), name: 'queues'},
]


class BackgroundApp extends Skeleton {

    constructor(options) {
        super(options)

        // Clears localstorage if the schema changed after a plugin update.
        if (!this.store.validSchema()) {
            this.modules.user.logout()
            return
        }

        // Continue last session if credentials are available.
        if (this.store.get('user') && this.store.get('username') && this.store.get('password')) {
            this.logger.info(`${this}reusing existing session from existing credentials`)
            this.reloadModules(false)

            if (this.env.isExtension && this.env.role.background) {
                browser.browserAction.setIcon({path: 'img/icon-menubar-active.png'})
            }
        }
    }


    /**
    * Restore the state from localStorage or start with a state template.
    */
    initStore() {
        let stateObj = this.store.get('state')
        if (stateObj) this.state = stateObj
        else this.state = this.getDefaultState()

        // Clears localstorage if the schema changed after a plugin update.
        if (!this.store.validSchema()) {
            this.modules.user.logout()
            return
        }

        this.timer = new Timer(this)
        this.telemetry = new Telemetry(this)
        this.api = new Api(this)
        this.sip = new Sip(this)
    }


    /**
    * Small helper that returns the version of the app.
    * The version is inserted at buildtime from the
    * package.json file.
    * @returns {String} - The current app's version.
    */
    version() {
        return process.env.VERSION
    }
}


function initApp(initParams) {
    initParams.modules = _modules
    return new BackgroundApp(initParams)
}

// For extensions, this is an executable endpoint.
if (env.isExtension) {
    env.role.background = true
    global.app = initApp({
        environment: env,
        name: 'bg',
    })
}

module.exports = initApp
