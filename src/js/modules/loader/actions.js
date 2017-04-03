'use strict'

const Actions = require('../../lib/actions')


/**
 * All UI related actions for the Widgets.
 */
class LoaderActions extends Actions {
    /**
     * When retrieving data for widget, display an indicator.
     */
    busyWidget(widgetOrWidgetName) {
        this.app.logger.debug(`${this}busy widget`)
        let widget = this.getWidget(widgetOrWidgetName)
        let isOpen = this.isWidgetOpen(widget)
        this.resetWidget(widget)
        $(widget).addClass('busy')
        if (isOpen) {
            this.openWidget(widget)
        }
    }


    closeWidget(widgetOrWidgetName) {
        let widget = this.getWidget(widgetOrWidgetName)
        // Cannot rely on just data.('opened') because this is not transparent to CSS.
        $(widget).data('opened', false).attr('data-opened', false)
        $(widget).find('.widget-content, .unauthorized-warning').hide(10)
    }


    /**
     * Get the element for a widget by return the same (already a jquery)
     * object or finding it by class name.
     */
    getWidget(widgetOrWidgetName) {
        if (widgetOrWidgetName instanceof jQuery) {
            return widgetOrWidgetName
        }
        return $('.container:not(.static) .widget.' + widgetOrWidgetName)
    }


    /**
     * Return a boolean indicating whether widget is open.
     */
    isWidgetOpen(widgetOrWidgetName) {
        let widget = this.getWidget(widgetOrWidgetName)
        return $(widget).data('opened') === true
    }


    /**
     * Open/close a widget's content and resize.
     */
    openWidget(widgetOrWidgetName) {
        this.app.logger.debug(`${this}open widget`)
        let widget = this.getWidget(widgetOrWidgetName)
        const data = widget.data()
        // Cannot rely on just data.('opened') because this is not transparent to CSS.
        $(widget).data('opened', true).attr('data-opened', true)
        // Inform the background that a widget is opened.
        this.app.emit('widget.open', {name: data.widget})
        if (widget.hasClass('unauthorized')) {
            $(widget).find('.unauthorized-warning').show(10)
        } else {
            $(widget).find('.widget-content').show(10)
        }
    }


    popup() {
        /**
         * Open/close the widget's content when clicking its header
         * (except when it's busy).
         */
        $('html').on('click', '.widget:not(.busy) .widget-header', (e) => {
            let widget = $(e.currentTarget).closest('[data-opened]')
            if (this.isWidgetOpen(widget)) {
                if (!$(e.target).is(':input')) {
                    this.app.emit('widget.close', {
                        name: $(widget).data('widget'),
                    })
                    this.closeWidget(widget)
                }
            } else {
                this.openWidget(widget)
            }
        })

        this.app.on('widget.close', (data) => {
            this.closeWidget(data.name)
        })

        this.app.on('widget.indicator.start', (data) => {
            this.busyWidget(data.name)
        })

        // Other scripts may open a widget with an event.
        this.app.on('widget.open', (data) => {
            this.app.logger.debug(`${this}widget.open`)
            this.openWidget(data.name)
        })

        this.app.on('widget.unauthorized', (data) => {
            this.unauthorizeWidget(data.name)
        })

        this.app.on('widget.indicator.stop', (data) => {
            this.resetWidget(data.name)
        })
    }


    /**
     * Reset the busy indicator and close a widget.
     */
    resetWidget(widgetOrWidgetName) {
        this.app.logger.debug(`${this}reset widget`)
        let widget = this.getWidget(widgetOrWidgetName)
        $(widget).removeClass('busy').removeClass('unauthorized')
        let isOpen = this.isWidgetOpen(widget)
        this.closeWidget(widget)
        if (isOpen) {
            this.openWidget(widget)
        }
    }


    /**
     * Show the unauthorized warning for a widget.
     */
    unauthorizeWidget(widgetName) {
        let widget = this.getWidget(widgetName)
        this.resetWidget(widget)
        widget.addClass('unauthorized')
    }


    toString() {
        return `${this.app} [LoaderActions]      `
    }
}

module.exports = LoaderActions
