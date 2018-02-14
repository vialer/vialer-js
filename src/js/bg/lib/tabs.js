/**
* Tabs is a webextension-only class, so no need to
* check for environment conditions here.
*/
class Tabs {
    constructor(app) {
        this.app = app

        // Change the contextmenu items on these events.
        this.app.on('bg:user:login', () => this.contextMenuItems())
        this.app.on('bg:user:logout', () => browser.contextMenus.removeAll())

        // Triggered by a tab frame's observer script.
        this.app.on('bg:tabs:observer_toggle', (data) => {
            data.callback({observe: this.tabIconsEnabled(data.sender.tab)})
        })
        // Call this event when the updated application state needs to be
        // reflected in the context menus. Used for instance in a settings
        // watcher for the WebRTC enabled switch.
        this.app.on('bg:tabs:update_contextmenus', () => this.contextMenuItems())

        // Start with a clean contextmenu slate.
        if (this.app.state.user.authenticated) {
            this.contextMenuItems()
            this.toggleIcons(this.app.state.settings.click2dial.enabled)
        } else {
            browser.contextMenus.removeAll()
            this.toggleIcons(false)
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
                    this.app.emit('bg:calls:call_create', {number: info.selectionText, start: true, type: 'SIP'}, true)
                },
                title: this.app.$t('Call %s with WebRTC'),
            })
        }

        this._contextMenuItem = browser.contextMenus.create({
            contexts: ['selection'],
            onclick: (info, _tab) => {
                this.app.emit('bg:calls:call_create', {number: info.selectionText, start: true, type: 'ConnectAB'}, true)
            },
            title: this.app.$t('Call %s with {vendor} user', {vendor: this.app.state.vendor}),
        })
    }


    tabIconsEnabled(tab) {
        if (!this.app.state.user.authenticated) return false
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


    /**
    * This will toggle Click-to-dial icons and the
    * accompanying DOM observer in each tab on or off.
    * @param {Boolean} enable - Whether to switch it on or off.
    */
    toggleIcons(enable) {
        browser.tabs.query({}).then((tabs) => {
            tabs.forEach((tab) => {
                if (this.tabIconsEnabled(tab) && enable) {
                    this.app.emit('observer:enable', {frame: 'observer'}, false, tab.id)
                } else this.app.emit('observer:disable', {frame: 'observer'}, false, tab.id)
            })
        })
    }
}

module.exports = Tabs
