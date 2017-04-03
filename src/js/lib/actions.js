'use strict'
/**
 * Generic Actions class to distinguish between tabs, background
 * and contentscript.
 */
class Actions {

    constructor(app, module) {
        this.app = app
        this.module = module

        if (this.app.env.extension) {
            if (this.app.env.extension.tab) {
                this.tab(app)
            } else if (this.app.env.extension.popup) {
                this.popup(app)
            } else if (this.app.env.extension.background) {
                this.background(app)
            }
        } else {
            // All actions are needed in an app-like setting.
        }
    }


    background() {}


    popup() {}


    tab() {}


    reset() {}
}

module.exports = Actions
