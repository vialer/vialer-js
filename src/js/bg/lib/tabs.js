class Tabs {
    constructor(app) {
        this.app = app
        // Triggered by a tab frame's observer script.
        this.app.on('bg:tabs:observer_toggle', (data) => {
            data.callback({observe: this.observerToggle(data.sender.tab)})
        })

        // Toggle all observers running in all open tabs when the
        // background is starting.
        browser.tabs.query({}).then((tabs) => {
            tabs.forEach((tab) => {
                if (this.observerToggle(tab)) {
                    this.app.emit('observer:start', {frame: 'observer'}, false, tab.id)
                }
            })
        })
    }


    /**
     * Add a right-click contextmenu item to all browser tabs.
     */
    addContextMenuItem() {
        this.app.logger.info(`${this}adding contextmenu`)
        this._contextMenuItem = browser.contextMenus.create({
            contexts: ['selection'],
            onclick: (info, _tab) => {
                this.app.modules.dialer.dial(info.selectionText, _tab)
                this.app.analytics.telemetryEvent('Calls', 'Initiate ConnectAB', 'Webpage')
            },
            title: 'Call ',
        })
    }


    removeContextMenuItem() {
        this._contextMenuItem = null
        browser.contextMenus.removeAll()
    }


    /**
    * Called when the tab observer is initialized, by calling
    * `dialer:observer.ready` on the background. Determines whether the
    * DOM observer and c2d icons should be switched on or off.
    * The callback is done to the observer script.
    * @param {Object} tab - The tab that is requesting observer status.
    * @returns {Boolean} - Whether the observer should be listening.
    */
    observerToggle(tab) {
        if (!this.app.state.user.authenticated) {
            this.app.logger.debug(`${this}not observing because user is not logged in`)
            this.removeContextMenuItem()
            return false
        }

        // Add the context menu to dial the selected number when
        // right mouse-clicking. Thqe contextmenu is available, even when
        // c2d icons are disabled. Also, this can't be switched per tab,
        // so don't take blacklisted tabs in account.
        if (!this._contextMenuItem) this.addContextMenuItem()

        if (!this.app.state.settings.click2dial.enabled) {
            this.app.logger.debug(`${this}not observing because icons are disabled`)
            return false
        }

        // Test if one of the blacklisted sites matches.
        let blacklisted = false
        for (let blacklistRegex of this.app.state.settings.click2dial.blacklist) {
            if (new RegExp(blacklistRegex).test(tab.url)) {
                blacklisted = true
                break
            }
        }

        if (blacklisted) {
            this.app.logger.debug(`${this}not observing because this site is blacklisted: ${tab.url}`)
            return false
        }

        return true
    }
}

module.exports = Tabs
