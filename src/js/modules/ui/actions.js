/**
* @module Ui
*/
const Actions = require('../../lib/actions')


/**
* Actions for the Ui module.
*/
class UiActions extends Actions {

    toString() {
        return `${this.module}[actions] `
    }


    _background() {
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
            this.module.refreshWidgets(true)
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
    * Called when an external action occurs, like opening a new tab,
    * which requires to shift the focus of the user to the new
    * content. Don't close the existing window when it is called
    * from the popout.
    */
    _checkCloseMainPanel() {
        this.app.emit('ui:mainpanel.close')
        // Only close the existing window.
        if (this.app.env.extension && !this.app.env.extension.popout) {
            window.close()
        }
    }


    _popup() {
        // The popout behaves different from the popover. The contacts
        // widget is open by default.
        if (this.app.env.extension && this.app.env.extension.popout) {
            $('html').addClass('popout')
        }

        this.app.on('ui:widget.close', (data) => {
            // Popout has only the contacts widget open. It can't be closed.
            if (!this.app.env.extension || (this.app.env.extension && !this.app.env.extension.popout)) {
                this.module.closeWidget(data.name)
            }
        })

        this.app.on('ui:widget.busy', (data) => {
            this.module.busyWidget(data.name)
        })

        this.app.on('ui.widget.open', (data) => {
            this.module.openWidget(data.name)
        })

        this.app.on('ui:widget.reset', (data) => {
            this.module.resetWidget(data.name)
        })

        this.app.on('ui:widget.unauthorized', (data) => {
            this.module.unauthorizeWidget(data.name)
        })

        this.app.on('ui:mainpanel.loading', (data) => {
            $('#refresh').addClass('fa-spin')
        })

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
        if (!this.app.env.extension || (this.app.env.extension && !this.app.env.extension.popout)) {
            $('html').on('click', '.widget .widget-header', (e) => {
                let widget = $(e.currentTarget).closest('[data-opened]')
                if (this.module.isWidgetOpen(widget)) {
                    if (!$(e.target).is(':input')) {
                        this.app.emit('ui:widget.close', {
                            name: $(widget).data('widget'),
                        })
                        this.module.closeWidget(widget)
                    }
                } else {
                    this.module.openWidget(widget)
                }
            })
        }

        $('#close').click((e) => {
            this._checkCloseMainPanel()
        })

        /**
         * Emit that we want to logout.
         */
        $('#logout').click((e) => {
            this.app.emit('user:logout.attempt')
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

        // Switch between logged-in and login state.
        if (this.app.store.get('user') && this.app.store.get('username') && this.app.store.get('password')) {
            this.app.emit('ui:ui.restore')
            let user = this.app.store.get('username')
            $('#user-name').text(user)

            this.module.showPopup()
        } else {
            $('.login-section').removeClass('hide')
        }


        $(window).on('unload', () => {
            this.app.store.set('isMainPanelOpen', false)
        })


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
}

module.exports = UiActions
