'use strict'

const PanelsActions = require('./actions')


/**
 * A meaningful description.
 */
class PanelsModule {

    constructor(app) {
        this.app = app
        this.actions = new PanelsActions(app, this)
    }


    load() {}


    /**
     * Initialize all widgets.
     */
    refreshWidgets(update) {
        // Resets widget data
        if (this.app.store.get('widgets') === null) {
            let widgetData = {isOpen: {}}
            for (let widget in this.app.modules) {
                // Initial state for widget.
                widgetData.isOpen[widget] = false
                // each widget can share variables here.
                widgetData[widget] = {}
            }
            this.app.store.set('widgets', widgetData)
        }

        // Initial state for mainpanel.
        if (this.app.store.get('isMainPanelOpen') === null) {
            this.app.store.set('isMainPanelOpen', false)
        }

        for (let widget in this.app.modules) {
            this.app.emit('widget.close', {name: widget})
            this.app.emit('widget.indicator.start', {name: widget})
        }

        for (let widget in this.app.modules) {
            this.app.modules[widget].load(update)
        }
    }


    reset() {}


    /**
     * Reset storage.
     */
    resetStorage() {
        this.app.store.remove('widgets')
        this.app.store.remove('isMainPanelOpen')
    }


    /**
     * Reset all widgets.
     */
    resetWidgets() {
        for (let widget in this.app.modules) {
            this.app.modules[widget].reset()
        }
    }


    restore() {}


    toString() {
        return `${this.app} [Panels]             `
    }
}

module.exports = PanelsModule
