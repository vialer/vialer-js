/**
* Tabs is a webextension-only class, so no need to
* check for environment conditions here.
* @memberof app.modules.extension
*/
class Tabs {
    constructor(app) {
        this.app = app

        // Change the contextmenu items on these events.
        /** @event Hurl#snowball */
        this.app.on('bg:user:login', () => this.contextMenuItems())
        this.app.on('bg:user:logout', () => browser.contextMenus.removeAll())

        // Triggered by a tab frame's observer script when starting.
        this.app.on('bg:tabs:observer_toggle', (data) => {
            data.callback({observe: this.tabIconsEnabled(data.sender.tab)})
            // Restore last active message.
            if (this.app.modules.ui.lastLabelMessage) {
                this.signalIcons(this.app.modules.ui.lastLabelMessage)
            }
        })
        // Call this event when the updated application state needs to be
        // reflected in the context menus. Used for instance in a settings
        // watcher for the WebRTC enabled switch.
        this.app.on('bg:tabs:update_contextmenus', () => this.contextMenuItems())

        // Start with a clean contextmenu slate.
        if (this.app.state.user.authenticated) {
            this.contextMenuItems()
            this.signalIcons({enabled: this.app.state.settings.click2dial.enabled})
        } else {
            browser.contextMenus.removeAll()
            this.signalIcons({enabled: false})
        }
    }


    /**
     * Add a right-click contextmenu item to all browser tabs.
     */
    contextMenuItems() {
        browser.contextMenus.removeAll()

        if (this.app.state.settings.webrtc.enabled) {
            this._contextMenuItem = browser.contextMenus.create({
                contexts: ['selection'],
                onclick: (info, _tab) => {
                    // The extension popup may be opened from a contextmenu action.
                    this.app.emit('bg:calls:call_create', {number: info.selectionText, start: true, type: 'CallSIP'}, true)
                    browser.browserAction.openPopup((window) => {})
                },
                title: this.app.$t('Call %s with softphone'),
            })
        }

        this._contextMenuItem = browser.contextMenus.create({
            contexts: ['selection'],
            onclick: (info, _tab) => {
                // The extension popup may be opened from a contextmenu action.
                browser.browserAction.openPopup((window) => {})
                this.app.emit('bg:calls:call_create', {number: info.selectionText, start: true, type: 'ConnectAB'}, true)
            },
            title: this.app.$t('Call %s with {vendor} user', {vendor: this.app.state.app.vendor.name}),
        })
    }


    /**
    * This will toggle Click-to-dial icons and the
    * accompanying DOM observer in each tab on or off.
    * @param {Object} opts - Options to pass to the observer event.
    * @param {Boolean} opts.enable - Whether to switch it on or off.
    * @param {String} [opts.label] - Assign a label to a Click-to-dial icon.
    * @param {Number} [opts.numbers] - Target a specific icon by number.
    */
    signalIcons({enabled, label = null, numbers = []}) {
        browser.tabs.query({}).then((tabs) => {
            tabs.forEach((tab) => {
                if (this.tabIconsEnabled(tab)) {
                    this.app.emit('observer:click2dial:toggle', {enabled, frame: 'observer', label, numbers}, false, tab.id)
                } else {
                    this.app.emit('observer:click2dial:toggle', {enabled: false, frame: 'observer'}, false, tab.id)
                }
            })
        })
    }


    tabIconsEnabled(tab) {
        if (!this.app.state.user.authenticated) return false
        if (!this.app.state.settings.click2dial.enabled) return false
        // Test if one of the blacklisted sites matches.
        let allowedUrl = true
        for (let blacklistRegex of this.app.state.settings.click2dial.blacklist) {
            if (new RegExp(blacklistRegex).test(tab.url)) {
                allowedUrl = false
                break
            }
        }
        return allowedUrl
    }
}

module.exports = Tabs
