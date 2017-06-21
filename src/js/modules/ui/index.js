'use strict'

const UiActions = require('./actions')


/**
 * This module holds most of the logic used to interact
 * with the Click-to-dial UI. It is mainly concerned with generic
 * actions that change the DOM.
 */
class UiModule {
    /**
     * @param {ClickToDialApp} app - The application object.
     */
    constructor(app) {
        this.actions = new UiActions(app, this)
        this.app = app
    }


    /**
     * Display an indicator when retrieving data for widget.
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


    /**
     * Popup action; used to close a widget by setting some DOM properties.
     */
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


    hideLoginForm() {
        $('.login-section').addClass('hide')
    }


    /**
     * Return a boolean indicating whether widget is open.
     */
    isWidgetOpen(widgetOrWidgetName) {
        let widget = this.getWidget(widgetOrWidgetName)
        return $(widget).data('opened') === true
    }


    /**
     * Attempt to login.
     */
    login() {
        // Login when form is not empty.
        if ($('#username').val().trim().length && $('#password').val().length) {
            this.app.emit('login.attempt', {
                username: $('#username').val().trim(),
                password: $('#password').val(),
            })
        }
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

        this.app.reloadModules(update)
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
     * Reset widget state from storage.
     */
    resetWidgetState() {
        this.app.store.remove('widgets')
        this.app.store.remove('isMainPanelOpen')
    }


    /**
     * Reset the login indicator.
     */
    resetLoginButton() {
        let button = $('.login-button')
        $(button)
            .html($(button).data('reset-text'))
            .prop('disabled', false)
            .removeClass('loading')
            .removeClass('failed')
            .removeClass('info')
            .removeClass('temporary-text')
    }


    /**
     * Show/hide the panel's content.
     */
    showPanel() {
        $('.container').removeClass('hide')
    }


    toString() {
        return `${this.app} [Ui]             `
    }


    /**
     * Show the unauthorized warning for a widget.
     */
    unauthorizeWidget(widgetName) {
        let widget = this.getWidget(widgetName)
        this.resetWidget(widget)
        widget.addClass('unauthorized')
    }

}

module.exports = UiModule
