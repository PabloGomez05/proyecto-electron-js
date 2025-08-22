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
                {
                    label:'Pausar/Reanudar',
                    accelerator: 'Space',
                    click: () => {
                        mainWindow.webContents.send('pause-game')
                    }
                },
                {type: 'separator'},
                {
                    label:'Guardar partida',
                    accelerator:'CmdOrCtrl+S',
                    click: () => {
                        saveGame()
                    }
                },
                {
                    label:'Cargar Partida',
                    accelerator:'CmdOrCtrl+O',
                    click: () => {
                        LoadGame()
                    }
                },
                {type:'separator'},
                {
                    label:'Salir',
                    accelerator: proccess.platform === 'darwin' ? 'Cmd+Q':'Ctrl+Q',
                    click: ()   => {
                        app.quit()
                    }
                }
            ]
        },

// Categorias 

        {
            label:'Categorias',
            submenu: [
                {
                    label:'Animales',
                    type:'radio',
                    click: () => {
                        mainWindow.webContents.send('change-category','animals')
                    }
                },
                {
                    label:'Países',
                    type:'radio',
                    click: () => {
                        mainWindow.webContents.send('change-category','countries')
                    }
                },
                {
                    label:'Ciencia',
                    type:'radio',
                    click: () => {
                        mainWindow.webContents.send('change-category','science')
                    }
                },
                { 
                    label:'Deportes',
                    type:'radio',
                    click: () => {
                        mainWindow.webContents.send('change-category','sports')
                    }
                }
            ]
        },
        
    
    
    
    
    
    
    
    
    
    ]
}


app.whenReady().then(() => {
    createWindow()
})