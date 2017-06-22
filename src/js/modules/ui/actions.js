'use strict'

const Actions = require('../../lib/actions')


/**
 * All UI related actions for the Widgets.
 */
class UiActions extends Actions {

    _background() {
        this.app.on('help', (data) => {
            // Open the plugin wiki page.
            this.app.browser.tabs.create({url: 'http://wiki.voipgrid.nl/index.php/Chrome_plugin'})
        })

        this.app.on('login.attempt', (data) => {
            // Attempt to log in.
            this.app.store.set('username', data.username)
            this.app.store.set('password', data.password)
            this.app.emit('login.indicator.start')
            this.app.auth.login(this.app.store.get('username'), this.app.store.get('password'))
        })

        this.app.on('logout.attempt', (data) => {
            this.app.logger.info(`${this}logout.attempt`)
            this.app.auth.logout()
        })

        this.app.on('widget.close', (data) => {
            // Keep track of closed widgets.
            this.app.logger.info(`${this}widget.close`)
            let widgetData = this.app.store.get('widgets')
            widgetData.isOpen[data.name] = false
            this.app.store.set('widgets', widgetData)
            this.app.timer.update('queue.size')
        })

        this.app.on('widget.open', (data) => {
            // Keep track of opened widgets.
            this.app.logger.info(`${this}widget.open on ${data.name}`)
            let widgetData = this.app.store.get('widgets')
            widgetData.isOpen[data.name] = true
            this.app.store.set('widgets', widgetData)
            this.app.timer.update('queue.size')
        })

        this.app.on('restore', (data) => {
            this.app.restoreModules()
        })

        /**
         * Stop callstatus timer for callid when the callstatus dialog closes.
         */
        this.app.on('callstatus.onhide', (data) => {
            this.app.logger.info(`${this}callstatus.onhide`)
            // We no longer need this call's status.
            let timerSuffix = `-${data.callid}`
            this.app.timer.stopTimer(`callstatus.status${timerSuffix}`)
            this.app.timer.unregisterTimer(`callstatus.status${timerSuffix}`)
        })

        /**
         * Start callstatus timer function for callid when the callstatus
         * dialog opens. The timer function updates the call status
         * periodically.
         */
        this.app.on('callstatus.onshow', (data) => {
            this.app.logger.info(`${this}callstatus.onshow`)
            // Start updating the call status.
            let timerSuffix = `-${data.callid}`
            this.app.timer.startTimer(`callstatus.status${timerSuffix}`)
        })

        this.app.on('refresh', (data) => {
            this.app.logger.info(`${this}mainpanel.refresh`)
            this.app.emit('mainpanel.refresh.start')
            this.module.refreshWidgets(true)
            this.app.emit('mainpanel.refresh.stop')
        })

        /**
         * Open settings url with or without a token for auto login.
         * Either opens:
         *  - platformUrl + user/autologin/?token=*token*&username=*username*&next=/ + path (with token)
         *  - platformUrl + path (without token)
         */
        this.app.on('settings', (data) => {
            this.app.logger.info(`${this}mainpanel.settings`)
            let openSettings = (response) => {
                let path = `client/${this.app.store.get('user').client_id}/user/${this.app.store.get('user').id}/change/#tabs-3`
                // add token if possible
                if (response.token) {
                    path = `user/autologin/?token=${response.token}&username=${this.app.store.get('username')}&next=/${path}`
                }

                let platformUrl = this.app.api.getPlatformUrl()
                this.app.browser.tabs.create({url: platformUrl + path})
            };

            this.app.api.asyncRequest(this.app.api.getUrl('autologin'), null, 'get', {
                onOk: openSettings,
                onNotOk: openSettings,
            })
        })

        this.app.on('close', (data) => {
            this.app.logger.info(`${this}mainpanel.close`)
        })


        this.app.on('panel.dial', (data) => {
            let b_number = data.b_number
            let tab = null
            let silent = true
            this.app.dialer.dial(b_number, tab, silent)
            this.app.analytics.trackClickToDial('Colleagues')
        })
    }


    _popup() {
        this.app.on('widget.close', (data) => {
            this.module.closeWidget(data.name)
        })

        this.app.on('widget.indicator.start', (data) => {
            this.module.busyWidget(data.name)
        })

        // Other scripts may open a widget with an event.
        this.app.on('widget.open', (data) => {
            this.app.logger.debug(`${this}widget.open`)
            this.module.openWidget(data.name)
        })

        this.app.on('widget.unauthorized', (data) => {
            this.module.unauthorizeWidget(data.name)
        })

        this.app.on('widget.indicator.stop', (data) => {
            this.module.resetWidget(data.name)
        })

        /**
         * Open/close the widget's content when clicking its header
         * (except when it's busy).
         */
        $('html').on('click', '.widget:not(.busy) .widget-header', (e) => {
            let widget = $(e.currentTarget).closest('[data-opened]')
            if (this.module.isWidgetOpen(widget)) {
                if (!$(e.target).is(':input')) {
                    this.app.emit('widget.close', {
                        name: $(widget).data('widget'),
                    })
                    this.module.closeWidget(widget)
                }
            } else {
                this.module.openWidget(widget)
            }
        })

        $('#close').click((e) => {
            this.app.emit('close')
            window.close()
        })

        $('#logout').click((e) => {
            this.app.emit('logout.attempt')
        })
        $('#popout').click((e) => {
            this.app.browser.tabs.create({url: this.app.browser.runtime.getURL('/build/click-to-dial-popup.html?popout=true')})
        })
        $('#help').click((e) => {
            this.app.emit('help')
        })
        $('#refresh').click((e) => {
            this.app.emit('refresh')
        })
        $('#settings').click((e) => {
            this.app.emit('settings')
        })


        // Previously panels module
        if (this.app.env.extension && this.app.env.extension.popout) {
            $('html').addClass('popout')
            $(() => {
                // Open the contacts widget by default.
                this.app.modules.ui.actions.openWidget('contacts')
            })
        }
        // keep track whether this popup is open or closed
        this.app.store.set('isMainPanelOpen', true)

        /**
         * default_popup (panel.html) is reloaded every time, so the only way to 'persist' the data
         * is by reading data from storage and present them as they were.
         */
        if (this.app.store.get('user') && this.app.store.get('username') && this.app.store.get('password')) {
            this.app.emit('restore')
            let user = this.app.store.get('user')
            $('#user-name').text(user.email)
            this.module.hideLoginForm()
            this.module.showPanel()
        } else {
            this.app.logger.debug(`${this}no saved state`)
        }

        $(window).unload(() => {
            this.app.store.set('isMainPanelOpen', false)
        })

        // focus the first input field
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
                });

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

        /**
         * Display an indicator when logging in.
         */
        this.app.on('login.indicator.start', (data) => {
            let button = $('.login-button')
            $(button).html($(button).data('loading-text')).prop('disabled', true).addClass('loading')
        })

        /**
         * Show an error on login fail.
         */
        this.app.on('login.failed', (data) => {
            let button = $('.login-button')
            $(button)
                .html($(button).data('failed-text'))
                .prop('disabled', false)
                .addClass('failed')
                .addClass('temporary-text')
        })

        this.app.on('logout', (data) => {
            // Hide the main panel.
            $('.container').addClass('hide')
            // Show the login form.
            $('.login-section').removeClass('hide')
            // Reset the login form input.
            $('.login-form :input:visible').val('')
            this.module.resetLoginButton()
            // Focus the first input field.
            $('.login-form :input:visible:first').focus()

            // Show a message on logout.
            let button = $('.login-button')
            $(button)
                .html($(button).data('logout-text'))
                .prop('disabled', false)
                .addClass('info')
                .addClass('temporary-text')
        })

        // After login, show the user's e-mail address.
        this.app.on('login.success', (data) => {
            let user = data.user
            $('#user-name').text(user.email)

            this.module.hideLoginForm()
            this.module.showPanel()
        })

        this.app.on('mainpanel.refresh.start', (data) => {
            $('#refresh').addClass('fa-spin')
        })

        // Spin refresh icon while reloading widgets.
        this.app.on('mainpanel.refresh.stop', (data) => {
            setTimeout(() => {
                $('#refresh').removeClass('fa-spin')
            }, 200)
        })
    }


    toString() {
        return `${this.app} [UiActions]      `
    }
}

module.exports = UiActions
