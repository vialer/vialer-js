/**
* Generic base class for each module. Modules can be used in
* AppBackground and AppForeground to separate logical blocks
* of functionality from each other and to keep everything clear.
*/
class Plugin extends EventEmitter {
    /**
    * Base Module constructor.
    * @param {AppBackground} app - The background application.
    */
    constructor(app) {
        super(app)
        this.app = app
    }
}

module.exports = Plugin
