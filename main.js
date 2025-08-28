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

        // Niveles de dificultad
        {
            label: 'Dificultad',
            submenu: [
                {
                    label: 'Fácil (10x10)',
                    type: 'radio',
                    checked: true,
                    click: () => {
                        mainWindow.webContents.send('change-difficulty', 'easy')
                    }
                },
                {
                    label: 'Medio (12x12)',
                    type: 'radio',
                    click: () => {
                        mainWindow.webContents.send('change-difficulty', 'medium')
                    }
                },
                {
                    label: 'Difícil (15x15)',
                    type: 'radio',
                    click: () => {
                        mainWindow.webContents.send('change-difficulty', 'hard')
                    }
                }
            ]
        },

        //Funcion para poder ver estadisticas, configuracion y poder poner pantalla completa.
        
        {
            label: 'Ver',
            submenu: [
                {
                    label: 'Estadísticas',
                    accelerator: 'CmdOrCtrl+E',
                    click: () => {
                        showStats()
                    }
                },
                {
                    label: 'Configuración',
                    accelerator: 'CmdOrCtrl+,',
                    click: () => {
                        showSettings()
                    }
                },
                { type: 'separator' },
                {
                    label: 'Pantalla Completa',
                    accelerator: process.platform === 'darwin' ? 'Ctrl+Cmd+F' : 'F11',
                    click: () => {
                        mainWindow.setFullScreen(!mainWindow.isFullScreen())
                    }
                }
            ]
        },

        // Ayuda para el usuario con el respectivo manual, detalles sobre el creador de la app, la version e informacion de la licencia.

        {
            label: 'Ayuda',
            submenu: [
                {
                    label: 'Manual de Usuario',
                    click: () => {
                        showUserManual()
                    }
                },
                {
                    label: 'Acerca de',
                    click: () => {
                        showAbout()
                    }
                }
            ]
        } 
    ]

   // Menú específico para macOS
    if (process.platform === 'darwin') {
        template.unshift({
            label: app.getName(),
            submenu: [
                { role: 'about' },
                { type: 'separator' },
                { role: 'services' },
                { type: 'separator' },
                { role: 'hide' },
                { role: 'hideothers' },
                { role: 'unhide' },
                { type: 'separator' },
                { role: 'quit' }
            ]
        })
    }

    const menu = Menu.buildFromTemplate(template)
    Menu.setApplicationMenu(menu)
    

}



app.whenReady().then(() => {
    createWindow()
})