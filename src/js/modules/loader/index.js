'use strict'

const LoaderActions = require('./actions')
const _modules = [
    {name: 'availability', Module: require('../availability')},
    {name: 'contacts', Module: require('../contacts')},
    {name: 'queues', Module: require('../queues')},
    {name: 'panels', Module: require('../panels')},
    {name: 'page', Module: require('../page')},
]


/**
 * A meaningful description.
 */
class LoaderModule {
    /**
     * @param {ClickToDialApp} app - The application object.
     */
    constructor(app) {
        this.app = app
        this.app.modules = {}
        // Init these modules.
        for (let module of _modules) {
            this.app.modules[module.name] = new module.Module(this.app)
        }
        this.actions = new LoaderActions(app, this)
        this.app.logger.debug(`${this}${this.app._listeners} listeners registered`)
    }


    reloadModules() {
        for (let module in this.app.modules) {
            this.app.logger.debug(`${this}loading module ${module}`)
            // Use 'load' instead of 'restore' to refresh the data on browser restart.
            this.app.modules[module].load()
        }
        this.app.logger.debug(`${this}${this.app._listeners} listeners registered`)
    }


    toString() {
        return `${this.app} [Loader]             `
    }
}

module.exports = LoaderModule
