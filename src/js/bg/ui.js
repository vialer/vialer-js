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
        this.hasUI = false
        this.addListeners()
    }


    addListeners() {
        this.app.on('help', (data) => {
            // Open the plugin wiki page.
            browser.tabs.create({url: process.env.HOMEPAGE})
        })

        /**
        * Set the widget's open state to false.
        */
        this.app.on('ui:widget.close', (data) => {
            this.app.logger.info(`${this}setting ${data.name} widget state to closed`)
            let widgetState = this.app.store.get('widgets')
            widgetState.isOpen[data.name] = false
            this.app.store.set('widgets', widgetState)
            this.app.timer.update('queue.size')
        })

        this.app.on('ui:widget.open', (data) => {
            this.app.timer.update('queue.size')
        })

        this.app.on('ui:ui.restore', (data) => {
            this.app.restoreModules()
        })

        this.app.on('ui:ui.refresh', (data) => {
            this.app.logger.info(`${this}refresh ui`)
            this.app.emit('ui:mainpanel.loading')
            this.refreshWidgets(true)
            this.app.emit('ui:mainpanel.ready')
        })

        //Open settings url with or without a token for auto login.
        // Either opens:
        // eslint-disable-next-line max-len
        // - platformUrl + user/autologin/?token=*token*&username=*username*&next=/ + path (with token)
        // - platformUrl + path (without token)
        this.app.on('ui:settings', (data) => {
            this.app.logger.info(`${this}mainpanel.settings`)
            this.app.api.client.get('api/autologin/token/').then((res) => {
                let path = `client/${this.app.store.get('user').client_id}/user/${this.app.store.get('user').id}/change/#tc0=user-tab-2` // eslint-disable-line max-len
                if (res.data.token) {
                    const token = res.data.token
                    path = `user/autologin/?token=${token}&username=${this.app.store.get('username')}&next=/${path}`
                }
                browser.tabs.create({url: `${this.app.getPlatformUrl()}${path}`})
            })
        })

        this.app.on('ui:mainpanel.close', (data) => {
            this.app.logger.info(`${this}mainpanel.close`)
        })
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


    toString() {
        return `${this.app}[ui] `
    }




}

module.exports = UiModule
