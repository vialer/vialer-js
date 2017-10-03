/**
* @module Ui
*/
const UiActions = require('./actions')


/**
* The Ui module. It holds most of the logic used to interact
* with the Click-to-dial UI. It is mainly concerned with generic
* actions that change the DOM.
*/
class UiModule {
    /**
    * @param {ClickToDialApp} app - The application object.
    */
    constructor(app) {
        this.app = app
        this.hasUI = false
        this.actions = new UiActions(app, this)
    }


    /**
    * Display a loading indicator on the widget, used when
    * retrieving data for widget.
    * @param {String} widgetOrWidgetName - Reference to widget to set to busy.
    */
    busyWidget(widgetOrWidgetName) {
        let widget = this.getWidget(widgetOrWidgetName)
        if (!widget) return
        const data = widget.data()
        this.app.logger.debug(`${this}set ui state for widget '${data.widget}' to busy`)
        this.resetWidget(widget)
        $(widget).addClass('busy')

        // The popout doesn't change the open/closed status of ANY widget.
        if (this.app.env.extension && this.app.env.extension.popout) return

        if (this.isWidgetOpen(widget)) {
            this.openWidget(widget)
        }
    }


    /**
    * Popup action; used to close a widget by setting some DOM properties.
    * @param {String} widgetOrWidgetName - Reference to widget to close.
    */
    closeWidget(widgetOrWidgetName) {
        let widget = this.getWidget(widgetOrWidgetName)
        // Cannot rely on just data.('opened') because this is
        // not transparent to CSS.
        $(widget).data('opened', false).attr('data-opened', false)
    }


    /**
    * Get the element for a widget by return the same (already a jquery)
    * object or finding it by class name.
    * @param {String} widgetOrWidgetName - Reference to widget to find.
    * @returns {Jquery} - Selector to the widget container.
    */
    getWidget(widgetOrWidgetName) {
        if (widgetOrWidgetName instanceof $) {
            return widgetOrWidgetName
        }
        return $(`.container:not(.static) .widget.${widgetOrWidgetName}`)
    }


    /**
    * Return a boolean indicating whether widget is open.
    * @param {String} widgetOrWidgetName - Reference to widget to check.
    * @returns {Boolean} - Whether the widget is currently open or not.
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
                password: $('#password').val(),
                username: $('#username').val().trim(),
            })
        }
    }


    /**
    * Open/close a widget's content and resize.
    * @param {String} widgetOrWidgetName - Reference to widget to open.
    */
    openWidget(widgetOrWidgetName) {
        let widget = this.getWidget(widgetOrWidgetName)
        const data = widget.data()
        this.app.logger.debug(`${this}open widget ${data.widget}`)
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
    }


    /**
    * Refresh all widgets. Called from the refresh button in the popup.
    * @param {Boolean} reloadModules - Whether to reload all modules or not.
    */
    refreshWidgets(reloadModules) {
        // Reset widget data when none can be found.
        if (this.app.store.get('widgets') === null) {
            let widgetState = {isOpen: {}}
            for (let moduleName in this.app.modules) {
                if (this.app.modules[moduleName].hasUI) {
                    // Initial state for widget.
                    widgetState.isOpen[moduleName] = false
                    // each widget can share variables here.
                    widgetState[moduleName] = {}
                }
            }
            this.app.store.set('widgets', widgetState)
        }

        // Initial state for mainpanel.
        if (this.app.store.get('isMainPanelOpen') === null) {
            this.app.store.set('isMainPanelOpen', false)
        }

        for (let moduleName in this.app.modules) {
            // Modules with a UI are notified to reflect busy state.
            if (this.app.modules[moduleName].hasUI) {
                this.app.emit('ui:widget.close', {name: moduleName})
                this.app.emit('ui:widget.busy', {name: moduleName})
            }
        }
        this.app.reloadModules(reloadModules)
    }


    /**
    * Set the busy indicator.
    * @param {String} widgetOrWidgetName - Reference to widget to reset.
    */
    resetWidget(widgetOrWidgetName) {
        let widget = this.getWidget(widgetOrWidgetName)
        const data = widget.data()
        this.app.logger.debug(`${this}resetting ui state for widget '${data.widget}'`)
        $(widget).removeClass('busy').removeClass('unauthorized')
    }


    /**
     * Restore the widget state from localstorage.
     */
    restoreWidgetState() {
        // The popout doesn't change the open/closed status of ANY widget.
        if (this.app.env.extension && this.app.env.extension.popout) return

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
        // This is an OSX-related racing bug, caused by the popup animation
        // that prevents the popup height to be calculated properly.
        // See https://bugs.chromium.org/p/chromium/issues/detail?id=307912
        // for more information.
        if (this.app.env.os.osx) {
            setTimeout(() => {
                // Don't set the width when the html has a popout class
                // because the popout is responsible and has a fluid width.
                if (!$('html').hasClass('popout')) {
                    const width = $('body').width()
                    $('body').width(width + 1)
                }
            }, 150)
        }
    }


    toString() {
        return `${this.app}[ui] `
    }


    /**
    * Show the unauthorized warning for a widget.
    * @param {String} widgetOrWidgetName - Reference to widget to set to
    * unauthorized.
    */
    unauthorizeWidget(widgetOrWidgetName) {
        const widget = this.getWidget(widgetOrWidgetName)
        this.resetWidget(widget)
        widget.addClass('unauthorized')
    }

}

module.exports = UiModule
