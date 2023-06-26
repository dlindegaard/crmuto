const { app, BrowserWindow } = require('electron');
const proxy = require('./proxy');

function createWindow() {
    let win = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            nodeIntegration: true,
        }
    });

    win.loadFile('public/index.html');

    // Open the DevTools.
    win.webContents.openDevTools();
}

app.whenReady().then(createWindow);