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


        /**
        * Refresh all widgets. Called from the refresh button in the popup.
        * @param {Boolean} reloadModules - Whether to reload all modules or not.
        */
        this.app.on('ui:ui.refresh', (data) => {
            this.app.logger.info(`${this}refresh ui`)
            this.app.emit('ui:mainpanel.loading')
            // Initial state for mainpanel.
            if (this.app.store.get('isMainPanelOpen') === null) {
                this.app.store.set('isMainPanelOpen', false)
            }
            // Close all widgets and show a busy icon.
            this.emit('fg:set_state', {
                availability: {widget: {active: false, state: 'busy'}},
                contacts: {widget: {active: false, state: 'busy'}},
                queues: {widget: {active: false, state: 'busy'}},
            })

            this.app.reloadModules(true)
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


    toString() {
        return `${this.app}[ui] `
    }




}

module.exports = UiModule
