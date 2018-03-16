/**
* This is the Vialer-js app that runs all scripts
* combined, replacing all ipc messaging with local
* event emitters.
*/
const resizeSensor = require('css-element-queries').ResizeSensor

document.addEventListener('DOMContentLoaded', () => {
    const bgApp = require('../bg')({name: 'bg'})
    bgApp.on('ready', () => {
        const fgApp = require('../fg')({apps: {bg: bgApp}, name: 'fg'})
        if (process.env.NODE_ENV !== 'production') app.fg = fgApp

        // Set content height for electron.
        if (bgApp.env.isElectron) {
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
    })

    // Globals are disabled in production mode.
    if (process.env.NODE_ENV !== 'production') {
        if (!global.app) global.app = {bg: bgApp}
    }
})
