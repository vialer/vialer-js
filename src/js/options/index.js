let env = require('../lib/env')
const Skeleton = require('../lib/skeleton')
const ui = require('../lib/ui')


class OptionsApp extends Skeleton {

    constructor(options) {
        super(options)

        Object.assign(Object.getPrototypeOf(this), ui())

        // The settings pages are browser-specific. Distinguish between the
        // two by setting a css class on the html element.
        if (this.env.isChrome) $('html').addClass('chrome')
        if (this.env.isFirefox) $('html').addClass('firefox')

        // Cache all queried nodes.
        this.$ = {
            iconsEnabled: document.getElementById('c2d'),
            platformUrl: document.getElementById('platform-url'),
            platformWarning: document.querySelector('.platform-warning'),
            saveButton: document.getElementById('save'),
            status: document.getElementById('status'),
        }

        // Handler for the save action.
        this.$.saveButton.addEventListener('click', this.saveOptions.bind(this))

        // Determine whether the logout warning should be shown.
        this.$.platformUrl.addEventListener('keyup', (e) => {
            if (this.platformUrl !== e.target.value && this.store.get('user')) this.$.platformWarning.classList.remove('hide')
            else this.$.platformWarning.classList.add('hide')
        })

        this.restoreOptions()
    }

    saveOptions() {
        this.store.set('c2d', this.$.iconsEnabled.checked)
        this.store.set('platformUrl', this.$.platformUrl.value)
        this.setButtonState($('#save'), 'saved', true, 0)
        this.setButtonState($('#save'), 'default', false)
        // Only logout when the endpoint value is changed and the user
        // is currently logged in.
        if (this.platformUrl !== this.$.platformUrl.value && this.store.get('user')) {
            this.emit('user:logout.attempt')
        }
    }

    restoreOptions() {
        this.$.iconsEnabled.checked = this.store.get('c2d')
        this.$.platformUrl.value = this.store.get('platformUrl')
        // Keep a reference to the original platform url.
        this.platformUrl = this.$.platformUrl.value
    }
}


document.addEventListener('DOMContentLoaded', () => {
    env.role.options = true
    global.app = new OptionsApp({
        environment: env,
        modules: [],
        name: 'options',
    })
})
