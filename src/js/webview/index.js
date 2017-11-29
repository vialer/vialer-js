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
    global.bgApp = require('../bg')({
        environment: env_bg,
        name: 'bg',
    })

    env_popup.role.popup = true
    global.fgApp = require('../popup')({
        apps: {
            bg: global.bgApp,
        },
        environment: env_popup,
        name: 'fg',
    })
})
