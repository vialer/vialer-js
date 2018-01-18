/**
* The Dialer module. It takes care of actually dialing a phonenumber and
* updating the status about a call.
* @module Dialer
*/
class DialerModule {

    constructor(app, background = true) {
        this.app = app
        this.hasUI = false
        this._contextMenuItem = null
        // Hardcoded blacklist of sites because there is not yet a solution
        // that works for chrome and firefox using exclude site-urls.
        //
        // These sites are blocked primarily because they are javascript-heavy
        // which in turn leads to 100% cpu usage when trying to parse all the
        // mutations for too many seconds making it not responsive.
        //
        // the content script still tracks <a href="tel:xxxx"> elements.
        this.blacklist = [
            '^chrome',
            // we prefer not to add icons in documents
            '^https?.*docs\\.google\\.com.*$',
            '^https?.*drive\\.google\\.com.*$',

            // Pages on these websites tend to grow too large to parse them in
            // a reasonable amount of time.
            '^https?.*bitbucket\\.org.*$',
            '^https?.*github\\.com.*$',
            '^https?.*rbcommons\\.com.*$',

            // This site has at least tel: support and uses javascript to open
            // a new web page when clicking the anchor element wrapping the
            // inserted icon.
            '^https?.*slack\\.com.*$',
        ]

        this.addListeners()
        if (this.app.env.isExtension) this.addContextMenuItem()

    }

    _reset() {
        if (!this.app.env.isExtension) return
        // Called when logging the plugin out. Remove the contextmenu item.
        if (this._contextMenuItem) this.removeContextMenuItem()
        // Emit to each tab's running observer scripts that we don't want to
        // observe anymore.
        if (this.app.store.get('c2d')) {
            browser.tabs.query({}).then((tabs) => {
                tabs.forEach((tab) => {
                    // Emit all observers on the tab to stop.
                    this.app.emit('observer:stop', {frame: 'observer'}, false, tab.id)
                })
            })
        }
    }

    /**
     * Add a right-click contextmenu item to all browser tabs.
     */
    addContextMenuItem() {
        this.app.logger.info(`${this}adding contextmenu`)

        browser.contextMenus.removeAll().then(() => {
            this._contextMenuItem = browser.contextMenus.create({
                contexts: ['selection'],
                onclick: (info, _tab) => {
                    this.app.modules.dialer.dial(info.selectionText, _tab)
                    this.app.telemetry.event('Calls', 'Initiate ConnectAB', 'Webpage')
                },
                title: this.app.$t('Call selected number'),
            })
        })
    }


    addListeners() {
        /**
        * Emit to each tab's running observer scripts that we want to
        * observe the DOM and add icons to phonenumbers.
        */
        this.app.on('user:login.success', (data) => {
            // Only notify tabs in the context of an extension.
            if (!this.app.env.isExtension) return

            browser.tabs.query({}).then((tabs) => {
                tabs.forEach((tab) => {
                    if (this.switchObserver(tab)) {
                        this.app.emit('observer:start', {frame: 'observer'}, false, tab.id)
                    }
                })
            })
        })


        /**
        * The callstatus dialog is closed. We don't longer poll
        * the callstatus of the current call.
        */
        this.app.on('dialer:status.onhide', (data) => {
            if (this.app.timer.getRegisteredTimer(`dialer:status.update-${data.callid}`)) {
                this.app.timer.stopTimer(`dialer:status.update-${data.callid}`)
                this.app.timer.unregisterTimer(`dialer:status.update-${data.callid}`)
            }
        })


        /**
        * Start callstatus timer function for callid when the callstatus
        * dialog opens. The timer function updates the call status
        * periodically. Check the `dial` method in `dialer/index.js` method
        * for the used timer function.
        */
        this.app.on('dialer:status.start', (data) => {
            this.app.timer.startTimer(`dialer:status.update-${data.callid}`)
        })


        /**
        * Used to make the actual call
        */
        this.app.on('dialer:dial', (data) => {
            // Just make sure b_number is numbers only.
            const number = this.sanitizeNumber(data.b_number).replace(/[^\d+]/g, '')

            this.app.sip.call(number)
            if (data.analytics) {
                this.app.telemetry.event('Calls', 'Initiate ConnectAB', data.analytics)
            }
        })

        // The observer script in a frame indicates that it's ready to observe.
        // Check if it should add icons.
        if (this.app.env.isExtension) {
            this.app.on('dialer:observer.ready', (data) => {
                data.callback({observe: this.switchObserver(data.sender.tab)})
            })
        }
    }


    removeContextMenuItem() {
        this._contextMenuItem = null
        browser.contextMenus.removeAll()
    }


    /**
    * Process number to return a callable phone number.
    * @param {String} number - Number to clean.
    * @returns {String} - The cleaned number.
    */
    sanitizeNumber(number) {
        number = this.trimNumber(number)

        // Make numbers like +31(0) work.
        let digitsOnly = number.replace(/[^\d]/g, '')
        if (digitsOnly.substring(0, 3) === '310') {
            if (number.substring(3, 6) === '(0)') {
                number = number.replace(/^\+31\(0\)/, '+31')
            }
        }

        return number
    }


    /**
    * Called when the tab observer is initialized, by calling
    * `dialer:observer.ready` on the background. Determines whether the
    * DOM observer and c2d icons should be switched on or off.
    * The callback is done to the observer script.
    * @param {Object} tab - The tab that is requesting observer status.
    * @returns {Boolean} - Whether the observer should be listening.
    */
    switchObserver(tab) {
        if (!this.app.store.get('user')) {
            this.app.logger.info(`${this}not observing because user is not logged in`)
            this.removeContextMenuItem()
            return false
        }

        if (!this.app.store.get('c2d')) {
            this.app.logger.info(`${this}not observing because icons are disabled`)
            return false
        }

        // Test if one of the blacklisted sites matches.
        let blacklisted = false
        for (let i = 0; i < this.blacklist.length; i++) {
            if (new RegExp(this.blacklist[i]).test(tab.url)) {
                blacklisted = true
                break
            }
        }

        if (blacklisted) {
            this.app.logger.info(`${this}not observing because this site is blacklisted: ${tab.url}`)
            return false
        }

        return true
    }


    toString() {
        return `${this.app}[dialer] `
    }


    /**
    * Return a number trimmed from white space.
    * @param {String} number - Number to trim.
    * @returns {String} - The whitespace trimmed number.
    */
    trimNumber(number) {
        // Force possible int to string.
        number = '' + number
        // Remove white space characters.
        return number.replace(/ /g, '')
    }
}

module.exports = DialerModule
