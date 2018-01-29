/**
* This is the Vialer-js app that runs all scripts
* combined, replacing all ipc messaging with local
* event emitters.
*/
const resizeSensor = require('css-element-queries').ResizeSensor

document.addEventListener('DOMContentLoaded', () => {

    global.bgApp = require('../bg')({name: 'bg'})
    global.fgApp = require('../fg')({
        apps: {bg: global.bgApp},
        name: 'fg',
    })


    // Set content height for electron.
    if (global.bgApp.env.isElectron) {
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
