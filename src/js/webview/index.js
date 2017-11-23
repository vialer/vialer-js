/**
* This is the Vialer-js app that runs all scripts
* combined, replacing all ipc messaging with local
* event emitters.
*/
let env_bg = require('../lib/env')
let env_popup = require('../lib/env')
const resizeSensor = require('css-element-queries').ResizeSensor


document.addEventListener('DOMContentLoaded', () => {
    // Set content height for electron.
    if (env_bg.isElectron) {
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

    env_bg.role.background = true
    const bgApp = require('../bg')({
        environment: env_bg,
        i18n: require('../../_locales/en/messages.json'),
        name: 'webview_bg',
    })

    env_popup.role.popup = true
    require('../popup')({
        apps: {
            bg: bgApp,
        },
        environment: env_popup,
        i18n: require('../../_locales/en/messages.json'),
        name: 'webview_popup',
    })
})
