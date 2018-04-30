/**
* @module User
*/
class UserModule {

    constructor(app) {
        this.app = app
        this.addListeners()
    }


    addListeners() {
        let _$ = {}
        _$.accountInfo = $('#user-name')
        _$.emailInput = $('#username')
        _$.loginButton = $('.login-button')
        _$.passwordInput = $('#password')
        _$.twoFactorInput = $('#twofactor')
        _$.twoFactorButton = $('.two-factor-button')

        const login = () => {
            const password = _$.passwordInput.val()
            const username = _$.emailInput.val().trim()

            // Login when form is not empty.
            if (password.length && username.length) {

                this.app.emit('user:login.attempt', {
                    password,
                    username,
                })
            }
        }

        const loginWithTwoFactor = () => {
            const twoFactorToken = _$.twoFactorInput.val().trim()

            this.app.emit('user:loginTwoFactor.attempt', {
                twoFactorToken,
            })
        }


        // This prevents an extra tabbable focus element
        // (the popup container) in Firefox.
        $('.login-form :input').keydown((e) => {
            if (e.which === 9) {
                let inputs = $('.login-form :input').filter((index, input) => {
                    return e.currentTarget.tabIndex < input.tabIndex
                })

                if (inputs.length === 0) _$.emailInput.focus()
                else $(inputs[0]).focus()
                e.preventDefault()
            }
        })

        // Handle toggling the login button and logging in on enter.
        $('.login-form :input').keyup((e) => {
            // Toggle disabling/enabling of the login button based on the
            // validity of the input elements.
            if (_$.emailInput.val().trim().length && _$.passwordInput.val().length) {
                _$.loginButton.prop('disabled', false)
            } else {
                _$.loginButton.prop('disabled', true)
            }
            // Login on enter.
            if (e.which === 13) {
                e.preventDefault()
                login()
            }
        })

        // Login with the button.
        _$.loginButton.on('click', (e) => {
            login()
        })

        $('.two-factor-form').submit((e) => {
            e.preventDefault();
            loginWithTwoFactor()
        })

        // Handle toggling the two factor button and logging in on enter.
        $('.two-factor-form :input').keyup((e) => {
            // Toggle disabling/enabling of the login button based on the
            // validity of the input elements.
            if (_$.twoFactorInput.val().trim().length) {
                _$.twoFactorButton.prop('disabled', false)
            } else {
                _$.twoFactorButton.prop('disabled', true)
            }
        })

        _$.twoFactorButton.on('click', (e) => {
            e.preventDefault()
            loginWithTwoFactor()
        })

        // Change the stored username/emailaddress on typing, so
        // we can restore the value when the popup is restarted.
        _$.emailInput.keyup((e) => {
            this.app.store.set('username', e.currentTarget.value)
        })
        // Set the username/emailaddress field on load, when we still
        // have a cached value from localstorage.
        if (this.app.store.get('username')) {
            _$.emailInput.val(this.app.store.get('username'))
        }

        /**
        * Show an error on login fail.
        */
        this.app.on('user:login.failed', (data) => {
            let button = $('.login-button')
            // This is an indication that an incorrect platform url is used.
            if (data.reason === 404) this.app.modules.ui.setButtonState(button, 'error', true, 0)
            else this.app.modules.ui.setButtonState(button, 'failed', true, 0)
            this.app.modules.ui.setButtonState(button, 'default', function() {
                if (_$.emailInput.val().trim().length && _$.passwordInput.val().length) {
                    return false
                } else {
                    return true
                }
            })
        })

        /**
        * Show an error on login fail in case a two factor token is needed.
        */
        this.app.on('user:login.twoFactorMandatory', (data) => {
            this.app.modules.ui.setButtonState(_$.twoFactorButton, 'default', true, 0)
            this.app.modules.ui.showTwoFactorView()
            _$.twoFactorInput.focus()
        })

        /**
        * Show an error on two factor login fail.
        */
        this.app.on('user:twoFactorLogin.failed', () => {
            this.app.store.remove('twoFactorToken');
            this.app.modules.ui.setButtonState(_$.twoFactorButton, 'error', true, 0)
        })

        /**
        * Display an indicator when logging in.
        */
        this.app.on('user:loginTwoFactor.in_progress', (data) => {
            this.app.modules.ui.setButtonState(_$.twoFactorButton, 'loading', true, 0)
        })

        /**
        * Display an indicator when logging in.
        */
        this.app.on('user:login.in_progress', (data) => {
            this.app.modules.ui.setButtonState($('.login-button'), 'loading', true, 0)
        })

        // After login, show the user's e-mail address.
        this.app.on('user:login.success', (data) => {
            _$.accountInfo.text(data.user.email)
            this.app.modules.ui.showAppView()
        })

        this.app.on('user:logout.success', (data) => {
            if (this.app.store.get('telemetry') === null) {
                this.app.modules.ui.showTelemetryView()
            } else {
                this.app.modules.ui.showLoginView()
                $('.login-form :input:visible').val('')
                $('.login-form :input:visible:first').focus()
            }

            // Set the username/emailaddress field on load, when we still
            // have a cached value from localstorage.
            if (this.app.store.get('username')) {
                _$.emailInput.val(this.app.store.get('username'))
            }



            // Show a message on logout.
            let button = $('.login-button')
            this.app.modules.ui.setButtonState(button, 'logout', true, 0)
            this.app.modules.ui.setButtonState(button, 'default', true)
        })
    }
}

module.exports = UserModule
