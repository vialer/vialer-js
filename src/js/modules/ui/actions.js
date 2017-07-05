/**
 * @module Ui
 */
const Actions = require('../../lib/actions')


/**
 * Actions for the Ui module.
 */
class UiActions extends Actions {

    _background() {
        this.app.on('help', (data) => {
            // Open the plugin wiki page.
            this.app.browser.tabs.create({url: 'http://wiki.voipgrid.nl/index.php/Chrome_plugin'})
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
            // Reopen the contacts widget when data.popout = true.
            this.module.refreshWidgets(true, data.popout)
            this.app.emit('ui:mainpanel.ready')
        })

        /**
         * Open settings url with or without a token for auto login.
         * Either opens:
         *  - platformUrl + user/autologin/?token=*token*&username=*username*&next=/ + path (with token)
         *  - platformUrl + path (without token)
         */
        this.app.on('ui:settings', (data) => {
            this.app.logger.info(`${this}mainpanel.settings`)
            this.app.api.client.get('api/autologin/token/')
            .then((res) => {
                let path, token
                const redirectPath = `client/${this.app.store.get('user').client_id}/user/${this.app.store.get('user').id}/change/#tc0=user-tab-2`
                if (res.data) token = res.data.token
                // add token if possible
                path = `user/autologin/?token=${token}&username=${this.app.store.get('username')}&next=/${redirectPath}`
                this.app.browser.tabs.create({url: `${this.app.getPlatformUrl()}${path}`})
            })
        })

        this.app.on('ui:mainpanel.close', (data) => {
            this.app.logger.info(`${this}mainpanel.close`)
        })

        this.app.on('panel.dial', (data) => {
            this.app.modules.dialer.dial(data.b_number, null, true)
            this.app.analytics.trackClickToDial('Colleagues')
        })
    }


    _popup() {
        this.app.on('ui:widget.close', (data) => {
            this.module.closeWidget(data.name)
        })

        this.app.on('ui:widget.busy', (data) => {
            this.module.busyWidget(data.name)
        })

        this.app.on('ui.widget.open', (data) => {
            this.module.openWidget(data.name)
        })

        // Hack in popout to display bottom border.
        this.app.on('ui:widget.open', (data) => {
            if (data.name === 'contacts') {
                $('.contacts .list .contact:visible:last').addClass('last')
            }
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
            }, 200)
        })

        /**
         * Open/close the widget's content when clicking its header
         * (except when it's busy).
         */
        $('html').on('click', '.widget:not(.busy) .widget-header', (e) => {
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

        $('#close').click((e) => {
            this.app.emit('ui:mainpanel.close')
            window.close()
        })

        /**
         * Emit that we want to logout.
         */
        $('#logout').click((e) => {
            this.app.emit('user:logout.attempt')
        })

        $('#popout').click((e) => {
            this.app.browser.tabs.create({url: this.app.browser.runtime.getURL('webext_popup.html?popout=true')})
        })
        $('#help').click((e) => {
            this.app.emit('help')
        })
        $('#refresh').click((e) => {
            this.app.emit('ui:ui.refresh', {popout: this.app.env.extension.popout})
        })
        $('#settings').click((e) => {
            this.app.emit('ui:settings')
        })


        // The popout behaves different from the popover. The contacts
        // widget is open by default.
        if (this.app.env.extension && this.app.env.extension.popout) {
            $('html').addClass('popout')
            $(() => {
                // Open the contacts widget by default.
                this.module.openWidget('contacts')
            })
        }
        // keep track whether this popup is open or closed
        this.app.store.set('isMainPanelOpen', true)

        /**
         * Popup is reloaded every time, so the only way to 'persist' the data
         * is by reading data from storage and present them as they were.
         */
        if (this.app.store.get('user') && this.app.store.get('username') && this.app.store.get('password')) {
            this.app.emit('ui:ui.restore')
            let user = this.app.store.get('user')
            $('#user-name').text(user.email)
            this.module.hideLoginForm()
            this.module.showPopup()
        } else {
            this.app.logger.debug(`${this}no saved state`)
        }


        $(window).on('unload', () => {
            this.app.store.set('isMainPanelOpen', false)
        })


        // Focus the first input field.
        $('.login-form :input:visible:first').focus()

        /**
         * Capture keys in login form.
         */
        $('.login-form :input').keydown((e) => {
            switch (e.which) {
            // Cycle through proper fields with tab.
            case 9:
                let inputs = $('.login-form :input').filter((index, input) => {
                    return e.currentTarget.tabIndex < input.tabIndex
                })

                if (inputs.length === 0) {
                    $('#username').focus()
                } else {
                    $(inputs[0]).focus()
                }

                e.preventDefault()
                break
            // Login on enter.
            case 13:
                this.module.login()
                e.preventDefault()
                break
            }

            if ($('.login-button').hasClass('temporary-text')) {
                this.module.resetLoginButton()
            }
        })

        /**
         * Login with the button.
         */
        $('.login-button').click((e) => {
            if ($('.login-button').hasClass('temporary-text')) {
                this.module.resetLoginButton()
            } else {
                this.module.login()
            }
        })
    }


    toString() {
        return `${this.module}[actions] `
    }
}

module.exports = UiActions
