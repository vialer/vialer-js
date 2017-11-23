module.exports = function() {
    return {
        /**
         * A single entrypoint for setting a button's state.
         * @param {$} button - The Jquery selector of the button.
         * @param {String} [state=default] - The state to switch the button to.
         * @param {Boolean|Function} [disabled=default] - Toggle the disabled state of the button.
         * @param {Number} timeout - Time after which to restore button.
         */
        setButtonState(button, state = 'default', disabled = false, timeout = 2000) {
            setTimeout(() => {
                if (typeof disabled === 'function') disabled = disabled()
                $(button).html($(button).data(`state-${state}`))
                if (['failed', 'error'].includes(state)) {
                    // An error message. Mark it so.
                    $(button).removeClass('info loading').prop('disabled', disabled).addClass('failed')
                } else if (['loading'].includes(state)) {
                    $(button).removeClass('info failed error').prop('disabled', disabled).addClass('loading')
                } else if (['default'].includes(state)) {
                    // The default state.
                    $(button).removeClass('info failed error loading').prop('disabled', disabled)
                } else {
                    // An info state.
                    $(button).removeClass('loading failed error').addClass('info').prop('disabled', disabled)
                }
            }, timeout)
        }
    }
}