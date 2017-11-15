/**
* This is the Vialer-js app that runs all scripts
* combined, replacing all ipc messaging with local
* event emitters.
*/
const VialerApp = require('./lib/app')

const resizeSensor = require('css-element-queries').ResizeSensor

let isElectron

try {
    // Skip electron from transpilation.
    let electronNamespace = 'electron'
    window.electron = require(electronNamespace)
    isElectron = true
} catch (e) {
    isElectron = false
}

const _modules = [
    {Module: require('./modules/availability'), name: 'availability'},
    {Module: require('./modules/contacts'), name: 'contacts'},
    {Module: require('./modules/dialer'), name: 'dialer'},
    {Module: require('./modules/ui'), name: 'ui'},
    {Module: require('./modules/user'), name: 'user'},
    {Module: require('./modules/queues'), name: 'queues'},
]

document.addEventListener('DOMContentLoaded', () => {
    // Set content height for electron.
    if (isElectron) {
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

    global.app = new VialerApp({
        environment: {
            electron: isElectron,
            extension: false,
        },
        i18n: require('../_locales/en/messages.json'),
        modules: _modules,
        name: 'webview',
    })
})
