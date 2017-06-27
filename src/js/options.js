'use strict'

const Skeleton = require('./lib/skeleton')

class OptionsApp extends Skeleton {

    constructor(options) {
        super(options)
        document.getElementById('save').addEventListener('click', this.saveOptions.bind(this))
        this.restoreOptions()
    }

    saveOptions() {
        let c2d = document.getElementById('c2d').checked;
        let platformUrl = document.getElementById('platformUrl').value
        this.store.set('c2d', c2d)
        this.store.set('platformUrl', platformUrl)
        // Update status to let user know options were saved.
        let status = document.getElementById('status')
        status.classList.remove('hide')
        setTimeout(function() {
            status.classList.add('hide')
        }, 750)
    }

    restoreOptions() {
        document.getElementById('c2d').checked = this.store.get('c2d')
        document.getElementById('platformUrl').value = this.store.get('platformUrl')
    }
}


document.addEventListener('DOMContentLoaded', () => {
    global.app = new OptionsApp({
        debugLevel: 'debug',
        name: 'options',
        environment: {
            extension: {
                background: false,
                popup: false,
                tab: false,
                callstatus: false,
                options: true,
            },
        },
    })
})
