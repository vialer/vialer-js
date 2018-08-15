/**
* VoIPGRID-platform specific functionality. Within the platform, it is
* possible to set a user's availability. This has effect when the
* user is part of a dialplan and can be used to dynamically switch
* between endpoints.
* @module ModuleAvailability
*/
const Plugin = require('vialer-js/lib/plugin')


/**
* Main entrypoint for Availability.
* @memberof AppBackground.plugins
*/
class PluginAvailability extends Plugin {
    /**
    * @param {AppBackground} app - The background application.
    * @param {Array} addons - List of AvailabilityAddon classes.
    */
    constructor(app, addons) {
        super(app)

        this.addons = []

        this.app.logger.info(`${this}${addons.length} addon(s) found.`)
        this.addons = addons.map((Addon) => new Addon(app))

        for (const addon of this.addons) {
            if (addon._platformData) this.app.on('bg:availability:platform_data', addon._platformData.bind(this))
            if (addon._updateAvailability) this.app.on('bg:availability:update', addon._updateAvailability.bind(this))
            if (addon._selectAccount) this.app.on('bg:availability:account_select', addon._selectAccount.bind(this))
        }
    }


    /**
    * Initializes the module's store.
    * Notice that the `sud` property is used to keep track of the
    * selecteduserdestination API endpoint reference.
    * @returns {Object} The module's store properties.
    */
    _initialState() {
        let adapterState = {}
        if (this.addons.length) {
            for (const addon of this.addons) {
                Object.assign(adapterState, addon._initialState())
            }
        }

        return Object.assign({
            available: true,
            dnd: false,
        }, adapterState)
    }


    /**
    * Call for platform data from the provider.
    */
    async _platformData() {
        for (const addon of this.addons) {
            await addon._platformData()
        }
    }


    /**
    * Setup availability-specific store watchers.
    * @param {Boolean} dndEnabled - Whether do-not-disturb is being enabled.
    * @returns {Object} - Properties that need to be watched.
    */
    _watchers() {
        let addonWatchers = {}
        for (const addon of this.addons) {
            if (addon._watchers) Object.assign(addonWatchers, this.adapter._watchers())
        }

        return Object.assign({
            'store.availability.dnd': (dndEnabled) => {
                this.app.plugins.ui.menubarState()
            },
        }, addonWatchers)
    }


    /**
    * Generate a representational name for this module. Used for logging.
    * @returns {String} - An identifier for this module.
    */
    toString() {
        return `${this.app}[availability] `
    }
}

module.exports = PluginAvailability
