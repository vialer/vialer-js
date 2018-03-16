/**
* Simple environment detection.
*/
module.exports = (function() {
    let env = {
        isBrowser: false,
        isChrome: false,
        isEdge: false,
        isElectron: false,
        isExtension: false,
        isFirefox: false,
        isLinux: false,
        isMacOS: false,
        isPopout: false,
        isWindows: false,
        role: {
            bg: false,
            callstatus: false,
            fg: false,
            observer: false,
            options: false,
            popout: false,
            tab: false,
        },
    }

    let ua

    if (global.document) {
        ua = navigator.userAgent.toLowerCase()

        if (ua.includes('edge')) {
            env.isEdge = true
        } else if (ua.includes('firefox')) {
            env.isFirefox = true
        } else if (ua.includes('chrome')) {
            env.isChrome = true
        }
    } else env.isNode = true

    if (global.navigator) {
        env.isBrowser = true

        if (navigator.platform.match(/(Linux)/i)) env.isLinux = true
        else if (navigator.platform.match(/(Mac)/i)) env.isMacOS = true
        else if (navigator.platform.match(/(Windows|Win32)/i)) env.isWindows = true
    }

    try {
        if ((chrome && chrome.extension) || (browser && browser.extension)) {
            env.isExtension = true
        }
    } catch (e) {
        // Catch reference errors.
    }

    try {
        // Skip electron from transpilation.
        let electronNamespace = 'electron'
        window.electron = require(electronNamespace)
        env.isElectron = true
    } catch (e) {
        // Catch reference errors.
    }

    global.env = env
    return env
})()
