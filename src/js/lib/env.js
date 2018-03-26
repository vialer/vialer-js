/**
* @module env
*/

/**
*
* Simple environment detection for the DOM and JavaScript.
* Vialer-js tries to be environment-agnostic, but sometimes
* a condition needs to be made, based on the current environment
* the code runs in.
* @param {Object} opts - Options to pass.
* @param {String} opts.role - The role this script will play.
* @returns {Object} - Environment-specific flags.
*/
function getEnvironment({role}) {
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
            fg: false,
            observer: false,
        },
    }

    env.role[role] = true

    let ua

    if (global.document) {
        ua = navigator.userAgent.toLowerCase()

        if (ua.includes('edge')) env.isEdge = true
        else if (ua.includes('firefox')) env.isFirefox = true
        else if (ua.includes('chrome')) env.isChrome = true
        else env.isNode = true
    }

    if (global.navigator) {
        env.isBrowser = true

        if (navigator.platform.match(/(Linux)/i)) env.isLinux = true
        else if (navigator.platform.match(/(Mac)/i)) env.isMacOS = true
        else if (navigator.platform.match(/(Windows|Win32)/i)) env.isWindows = true
        if (env.role.fg) {
            if (location.search.includes('popout=true')) {
                env.isPopout = true
                $('html').classList.add('popout')
            } else if (location.search.includes('webview=true')) {
                $('html').classList.add('webview')
            } else {
                $('html').classList.add('popup')
            }

            if (env.isChrome) $('html').classList.add('chrome')
            if (env.isEdge) $('html').classList.add('edge')
            if (env.isFirefox) $('html').classList.add('firefox')
            if (env.isExtension) $('html').classList.add('extension')

            if (env.isMacOS) {
                // Forces height recalculation of the popup in Chrome OSX.
                // See: https://bugs.chromium.org/p/chromium/issues/detail?id=307912
                setTimeout(() => {
                    const style = document.querySelector('#app').style
                    setTimeout(() => {
                        style.opacity = 1
                    })
                }, 200)
            }
        }
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
        if (env.role.fg) {
            $('html').classList.add('electron')
            // In Electron, a different IPC mechanism is used to set
            // the window height from the main script.
            electron.ipcRenderer.send('resize-window', {
                height: document.body.clientHeight,
                width: document.body.clientWidth,
            })

            resizeSensor(document.body, (e) => {
                electron.ipcRenderer.send('resize-window', {
                    height: document.body.clientHeight,
                    width: document.body.clientWidth,
                })
            })
        }
    } catch (e) {
        // Catch reference errors.
    }

    global.env = env
    return env
}


module.exports = getEnvironment
