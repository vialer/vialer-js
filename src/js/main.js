const electron = require('electron')
// Module to control application life.
const app = electron.app
const Tray = electron.Tray
// Module to create native browser window.
const BrowserWindow = electron.BrowserWindow

const path = require('path')
const url = require('url')
const {ipcMain} = require('electron')

const settings = require('./settings')

const WATCH = process.env.WATCH ? true : false

if (WATCH) {
    require('electron-reload')(__dirname, {
        electron: path.join(__dirname, 'node_modules', 'electron', 'dist', 'electron'),
    })
}

/**
* Initialize an Electron application.
*/
class AppElectron {
    constructor() {
        // This method will be called when Electron has finished
        // initialization and is ready to create browser windows.
        // Some APIs can only be used after this event occurs.
        app.on('ready', this.createWindow)
        app.commandLine.appendSwitch('ignore-certificate-errors')
        // Quit when all windows are closed.
        app.on('window-all-closed', function() {
            // On OS X it is common for applications and their menu bar
            // to stay active until the user quits explicitly with Cmd + Q
            if (process.platform !== 'darwin') {
                app.quit()
            }
        })

        app.on('activate', function() {
            // On OS X it's common to re-create a window in the app when the
            // dock icon is clicked and there are no other windows open.
            if (this.mainWindow === null) this.createWindow()
        })
    }


    createWindow() {
        this.tray = new Tray(path.join(__dirname, 'img', 'electron-systray.png'))
        this.tray.setToolTip(settings.name)


        // Create the browser window.
        this.mainWindow = new BrowserWindow({
            autoHideMenuBar: true,
            backgroundColor: '#ffffff',
            height: 300,
            icon: path.join(__dirname, 'img', 'electron-icon.png'),
            resizable: true,
            show: false,
            title: settings.name,
            width: 500,
        })

        ipcMain.on('resize-window', (event, data) => {
            const currentSize = this.mainWindow.getContentSize()
            if (data.height !== currentSize[1]) {
                if (data.height > 600) data.height = 600
                this.mainWindow.setSize(500, data.height, true)
                event.sender.send('resize-window-done')
            }
        })

        // and load the index.html of the app.
        this.mainWindow.loadURL(url.format({
            pathname: path.join(__dirname, 'index.html'),
            protocol: 'file:',
            slashes: true,
        }))

        this.mainWindow.once('ready-to-show', () => {
            this.mainWindow.show()
        })

        // Emitted when the window is closed.
        this.mainWindow.on('closed', function() {
            // Dereference the window object, usually you would store windows
            // in an array if your app supports multi windows, this is the time
            // when you should delete the corresponding element.
            this.mainWindow = null
        })
    }
}

global.app = new AppElectron()
