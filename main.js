const{app,BrowserWindow,Menu,Notification,dialog,ipcMain} = require('electron')
const path = require('path')

let mainWindow

const createWindow = () => {
    const win = new BrowserWindow({
        width: 800,
        height: 600,
        minWidth:800,
        minHeight:600,
        icon: path.join(__dirname,'assets/img/icono.png'),
        webPreferences:{
            preload:path.join(__dirname,'preload.js'),
            nodeIntegration:false,
            contextIsolation:true,
        }
    })

win.loadFile('views/index.html')


ipcMain.on('show-notification',(event,titttle,body) => {
    new Notification({tittle, body}).show()
})

// Abrir devtools en desarrollo
if(process.env.NODE_ENV=== 'development') {

mainWindow.webContents.openDevTools()}
}

//Creación del menu nativo de la app

const createMenu = () => {
    const template = [
        {
            label: 'Juego',
            submenu: [
                {
                    label: 'Nueva partida',
                    accelerator: 'CmdOrCtrl+N',
                    click: () => {
                        mainWindow.webContents.send('new-game')
                    }
                },

            ]
        }
    ]
}


app.whenReady().then(() => {
    createWindow()
})