const ui = require('../lib/ui')

/**
* The Ui module. It holds most of the logic used to interact
* with the Click-to-dial UI. It is mainly concerned with generic
* actions that change the DOM.
* @module Ui
*/
class UiModule {
    /**
    * @param {ClickToDialApp} app - The application object.
    */
    constructor(app) {
        this.app = app
        //TODO: MOVE TO COMPONENTS
        Object.assign(Object.getPrototypeOf(this), ui())
    }


    addListeners() {
        // The popout behaves different from the popover. The contacts
        // widget is open by default.
        if (this.app.env.isExtension && this.app.env.role.popout) $('html').addClass('popout')

        // Spin refresh icon while reloading widgets.
        this.app.on('ui:mainpanel.ready', (data) => {
            setTimeout(() => {
                $('#refresh').removeClass('fa-spin')
            }, 1000)
        })

        /**
         * Toggles the widget's content visibility when clicking its header.
         * Popout has only the contacts widget open and it can't be closed.
         */
        if (!this.app.env.isExtension || (this.app.env.isExtension && !this.app.env.role.popout)) {
            $('html').on('click', '.widget .widget-header', (e) => {
                let widget = $(e.currentTarget).closest('[data-opened]')
                if (this.isWidgetOpen(widget)) {
                    if (!$(e.target).is(':input')) {
                        this.app.emit('ui:widget.close', {
                            name: $(widget).data('widget'),
                        })
                        this.closeWidget(widget)
                    }
                } else {
                    this.openWidget(widget)
                }
            })
        }

        $('#close').click((e) => {
            this._checkCloseMainPanel()
        })

        $('#popout').click((e) => {
            browser.tabs.create({url: browser.runtime.getURL('index.html?popout=true')})
            this._checkCloseMainPanel()
        })
        $('#help').click((e) => {
            this.app.emit('help')
            this._checkCloseMainPanel()
        })
        $('#refresh').click((e) => {
            this.app.emit('ui:ui.refresh')
        })
        $('#settings').click((e) => {
            this.app.emit('ui:settings')
            this._checkCloseMainPanel()
        })

        if (!this.app.store.validSchema()) {
            this.app.emit('user:logout.attempt')
        }


        // Focus the first input field.
        $(window).on('load', () => {
            // Keep track whether this popup is open or closed.
            this.app.store.set('isMainPanelOpen', true)
            // setTimeout fix for FireFox.
            setTimeout(() => {
                $('.login-form :input:visible:first').focus()
            }, 100)
        })
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
        $(widget).addClass('busy')

        // The popout doesn't change the open/closed status of ANY widget.
        if (this.app.env.isExtension && this.app.env.role.popout) return

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
    * Open/close a widget's content and resize.
    * @param {String} widgetOrWidgetName - Reference to widget to open.
    */
    openWidget(widgetOrWidgetName) {
        let widget = this.getWidget(widgetOrWidgetName)
        const data = widget.data()
        this.app.logger.debug(`${this}open widget ${data.widget}`)

        let widgetState = this.app.store.get('widgets') ? this.app.store.get('widgets') : {}
        if (!widgetState.isOpen) widgetState.isOpen = {}
        // Opening widgets act as an accordeon. All other widgets are closed,
        // except the widget that needs to be open.
        for (const widgetName of ['contacts', 'availability', 'queues']) {
            let _widget = this.getWidget(widgetName)
            if (widgetName !== data.widget) {
                widgetState.isOpen[widgetName] = false
                this.closeWidget(widgetName)
            } else {
                widgetState.isOpen[widgetName] = true
                $(_widget).data('opened', true).attr('data-opened', true)
            }
        }
        this.app.store.set('widgets', widgetState)
        this.app.emit('ui:widget.open', {name: data.widget})
    }


    /**
     * Restore the widget state from localstorage.
     */
    restoreWidgetState() {
        // The popout doesn't change the open/closed status of ANY widget.
        if (this.app.env.isExtension && this.app.env.role.popout) return

        let widgetState = this.app.store.get('widgets')
        if (widgetState && widgetState.isOpen) {
            for (const moduleName of Object.keys(widgetState.isOpen)) {
                if (widgetState.isOpen[moduleName]) this.openWidget(moduleName)
                else this.closeWidget(moduleName)
            }
        }
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
        if (this.app.env.isOsx) {
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
        console.log("UNAUTHORIZED STATE WIDGET")
    }


    /**
    * Called when an external action occurs, like opening a new tab,
    * which requires to shift the focus of the user to the new
    * content. Don't close the existing window when it is called
    * from the popout.
    */
    _checkCloseMainPanel() {
        this.app.emit('ui:mainpanel.close')
        // Only close the existing window.
        if (this.app.env.isExtension && !this.app.env.role.popout) {
            window.close()
        }
    }

}

module.exports = UiModule
