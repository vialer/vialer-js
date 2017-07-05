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
        this.app = app
        this.actions = new UiActions(app, this)
    }


    /**
     * Display a loading indicator on the widget, used when
     * retrieving data for widget.
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
        $(widget).find('.widget-content, .unauthorized-warning').hide()
    }


    /**
     * Get the element for a widget by return the same (already a jquery)
     * object or finding it by class name.
     */
    getWidget(widgetOrWidgetName) {
        if (widgetOrWidgetName instanceof $) {
            return widgetOrWidgetName
        }
        return $(`.container:not(.static) .widget.${widgetOrWidgetName}`)
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
            this.app.emit('user:login.attempt', {
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
        const widgetName = data.widget

        let widgetState = this.app.store.get('widgets')
        // Opening widgets act as an accordeon. All other widgets are closed,
        // except the widget that needs to be open.
        for (const moduleName of Object.keys(widgetState.isOpen)) {
            let _widget = this.getWidget(widgetOrWidgetName)
            if (moduleName !== widgetName) {
                widgetState.isOpen[moduleName] = false
                this.closeWidget(moduleName)
            } else {
                widgetState.isOpen[moduleName] = true
                $(_widget).data('opened', true).attr('data-opened', true)
            }
        }
        this.app.store.set('widgets', widgetState)

        this.app.emit('ui:widget.open', {name: widgetName})
        if (widget.hasClass('unauthorized')) {
            $(widget).find('.unauthorized-warning').show()
        } else {
            $(widget).find('.widget-content').show()
        }
    }


    /**
     * Initialize all widgets. Called from the refresh button in the popup.
     */
    refreshWidgets(reloadModules, reopen) {
        // Reset widget data when none can be found.
        if (this.app.store.get('widgets') === null) {
            let widgetState = {isOpen: {}}
            for (let widget in this.app.modules) {
                // Initial state for widget.
                widgetState.isOpen[widget] = false
                // each widget can share variables here.
                widgetState[widget] = {}
            }
            this.app.store.set('widgets', widgetState)
        }

        // Initial state for mainpanel.
        if (this.app.store.get('isMainPanelOpen') === null) {
            this.app.store.set('isMainPanelOpen', false)
        }

        for (let widget in this.app.modules) {
            // Don't close the widget when the popout is active.
            if(!reopen) {
                this.app.emit('ui:widget.close', {name: widget})
                this.app.emit('ui:widget.busy', {name: widget})
            }
        }
        this.app.reloadModules(reloadModules, reopen)
    }


    /**
     * Reset the busy indicator and close a widget.
     */
    resetWidget(widgetOrWidgetName) {
        this.app.logger.debug(`${this}reset widget`)
        let widget = this.getWidget(widgetOrWidgetName)
        $(widget).removeClass('busy').removeClass('unauthorized')
        this.closeWidget(widget)
        if (this.isWidgetOpen(widget)) {
            this.openWidget(widget)
        }
    }


    /**
     * Restore the widget state from localstorage.
     */
    restoreWidgetState() {
        let widgetState = this.app.store.get('widgets')
        if (widgetState && widgetState.isOpen) {
            for (const moduleName of Object.keys(widgetState.isOpen)) {
                if (widgetState.isOpen[moduleName]) this.openWidget(moduleName)
                else this.closeWidget(moduleName)
            }
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
     * Show the popup content.
     */
    showPopup() {
        $('.container').removeClass('hide')
        this.restoreWidgetState()

        // https://bugs.chromium.org/p/chromium/issues/detail?id=307912
        setTimeout(() => {
            $('body').width(401)
        }, 150);
    }


    toString() {
        return `${this.app}[ui] `
    }


    /**
     * Show the unauthorized warning for a widget.
     */
    unauthorizeWidget(widgetName) {
        const widget = this.getWidget(widgetName)
        this.resetWidget(widget)
        widget.addClass('unauthorized')
    }

}

module.exports = UiModule
