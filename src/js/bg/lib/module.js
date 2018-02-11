/**
* Generic handling for each module.
*/
class Module extends EventEmitter {
    constructor(app) {
        super(app)
        this.app = app
    }


    _defaultState() {
        return {}
    }
}

module.exports = Module
