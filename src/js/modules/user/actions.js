/**
* @module User
*/
const Actions = require('../../lib/actions')


/**
* Actions for the User module.
*/
class UserActions extends Actions {

    toString() {
        return `${this.module}[actions] `
    }


    _background() {
        this.app.on('user:login.attempt', (data) => {
            // Attempt to log in.
            this.app.store.set('username', data.username)
            this.app.store.set('password', data.password)
            this.app.emit('user:login.in_progress')
            this.module.login(this.app.store.get('username'), this.app.store.get('password'))
        })

        this.app.on('user:logout.attempt', (data) => {
            this.module.logout()
        })
    }


    _popup() {
        /**
        * Show an error on login fail.
        */
        this.app.on('user:login.failed', (data) => {
            let button = $('.login-button')
            $(button)
                .html($(button).data('failed-text'))
                .prop('disabled', false)
                .addClass('failed')
                .addClass('temporary-text')
        })

        /**
        * Display an indicator when logging in.
        */
        this.app.on('user:login.in_progress', (data) => {
            let button = $('.login-button')
            $(button).html($(button).data('loading-text')).prop('disabled', true).addClass('loading')
        })

        // After login, show the user's e-mail address.
        this.app.on('user:login.success', (data) => {
            let user = data.user
            $('#user-name').text(user.email)

            this.app.modules.ui.hideLoginForm()
            this.app.modules.ui.showPopup()
        })

        this.app.on('user:logout.success', (data) => {
            // Hide the main panel.
            $('.container').addClass('hide')
            // Show the login form.
            $('.login-section').removeClass('hide')
            // Reset the login form input.
            $('.login-form :input:visible').val('')
            this.app.modules.ui.resetLoginButton()
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
    }
}

module.exports = UserActions
