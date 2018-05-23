/** @memberof lib */
/**
* Simple environment detection for the DOM and JavaScript.
* Vialer-js tries to be environment-agnostic, but sometimes
* a condition needs to be made, based on the current environment
* the code runs in.
* @module env
*/

/**
* Call this method in the script context to get
* the context back as an object.
* @param {Object} opts - Options
* @param {String} opts.role - The role this script will play.
* @returns {Object} - Environment-specific flags.
*/
function env({role}) {
    let _env = {
        isBrowser: false,
        isChrome: false,
        isEdge: false,
        isElectron: false,
        isExtension: false,
        isFirefox: false,
        isLinux: false,
        isMacOS: false,
        isNode: false,
        isPopout: false,
        isWindows: false,
        name: 'unknown',
        role: {
            bg: false,
            fg: false,
            observer: false,
        },
    }

    _env.role[role] = true

    let ua

    if (global.document) {
        ua = navigator.userAgent.toLowerCase()

        if (ua.includes('edge')) {
            _env.isEdge = true
            _env.name = 'edge'
        } else if (ua.includes('firefox')) {
            _env.isFirefox = true
            _env.name = 'firefox'
        } else if (ua.includes('chrome')) {
            _env.isChrome = true
            _env.name = 'chrome'
        }
    } else {
        _env.isNode = true
        _env.name = 'node'
    }

    if (global.navigator) {
        _env.isBrowser = true

        if (navigator.platform.match(/(Linux)/i)) _env.isLinux = true
        else if (navigator.platform.match(/(Mac)/i)) _env.isMacOS = true
        else if (navigator.platform.match(/(Windows|Win32)/i)) _env.isWindows = true
        if (_env.role.fg) {
            if (location.search.includes('popout=true')) {
                _env.isPopout = true
                $('html').classList.add('popout')
            } else {
                $('html').classList.add('popup')
            }

            if (_env.isChrome) $('html').classList.add('chrome')
            if (_env.isEdge) $('html').classList.add('edge')
            if (_env.isFirefox) $('html').classList.add('firefox')
            if (_env.isExtension) $('html').classList.add('extension')
        }
    }

    try {
        if ((chrome && chrome.extension) || (browser && browser.extension)) {
            _env.isExtension = true
        }
    } catch (e) {
        // Catch reference errors.
    }

    try {
        // Skip electron from transpilation.
        let electronNamespace = 'electron'
        window.electron = require(electronNamespace)
        _env.isElectron = true
        if (_env.role.fg) {
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

    return _env
}


module.exports = env
