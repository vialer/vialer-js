const Skeleton = require('./lib/skeleton')

class OptionsApp extends Skeleton {

    constructor(options) {
        super(options)

        // The settings pages are browser-specific. Distinguish between the
        // two by setting a css class on the html element.
        if (this.env.extension.isChrome) $('html').addClass('chrome-options')
        if (this.env.extension.isFirefox) $('html').addClass('firefox-options')

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
        // Update status to let user know options were saved.
        this.$.status.classList.remove('hide')
        setTimeout(() => {
            this.$.status.classList.add('hide')
            // Only logout when the endpoint value is changed and the user
            // is currently logged in.
            if (this.platformUrl !== this.$.platformUrl.value && this.store.get('user')) {
                this.emit('user:logout.attempt')
            }
        }, 750)
    }

    restoreOptions() {
        this.$.iconsEnabled.checked = this.store.get('c2d')
        this.$.platformUrl.value = this.store.get('platformUrl')
        // Keep a reference to the original platform url.
        this.platformUrl = this.$.platformUrl.value
    }
}


document.addEventListener('DOMContentLoaded', () => {
    global.app = new OptionsApp({
        environment: {
            extension: {
                background: false,
                callstatus: false,
                options: true,
                popup: false,
                tab: false,
            },
        },
        modules: [],
        name: 'options',
    })
})
