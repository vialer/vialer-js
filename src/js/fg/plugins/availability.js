const Plugin = require('vialer-js/lib/plugin')


/**
* Main entrypoint for Availability.
* @memberof AppBackground.plugins
*/
class PluginAvailability extends Plugin {
    constructor(app, addons) {
        super(app)

        this.addons = addons.map((Addon) => new Addon(app))
        this.app.logger.info(`${this}${addons.length} addon(s) found.`)
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
