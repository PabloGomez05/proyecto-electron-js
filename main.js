const{app,BrowserWindow,Menu,Notification,dialog,ipcMain} = require('electron')
const path = require('path')

let mainWindow

const createWindow = () => {
    const win = new BrowserWindow({
        width: 1000,
        height: 800,
        minWidth:800,
        minHeight:600,
        icon: path.join(__dirname,'assets/img/icono.png'),
        webPreferences:{
            preload:path.join(__dirname,'preload.js'),
            nodeIntegration:false,
            contextIsolation:true,
        }
    })

win.loadFile('views/menu.html')


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
                    accelerator: process.platform === 'darwin' ? 'Cmd+Q':'Ctrl+Q',
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

// Función para mostrar notificaciones
const showNotification = (title, body, icon = 'info') => {
    if (Notification.isSupported()) {
        new Notification({
            title: title,
            body: body,
            icon: path.join(__dirname, 'assets', 'icons', `${icon}.png`)
        }).show()
    }
}

// Función para guardar partida
const saveGame = async () => {
    const { filePath } = await dialog.showSaveDialog(mainWindow, {
        title: 'Guardar Partida',
        defaultPath: 'mi-partida.json',
        filters: [
            { name: 'Archivos de Partida', extensions: ['json'] }
        ]
    })
    
    if (filePath) {
        mainWindow.webContents.send('save-game', filePath)
    }
}

// Función para cargar partida
const loadGame = async () => {
    const { filePaths } = await dialog.showOpenDialog(mainWindow, {
        title: 'Cargar Partida',
        filters: [
            { name: 'Archivos de Partida', extensions: ['json'] }
        ],
        properties: ['openFile']
    })
    
    if (filePaths.length > 0) {
        mainWindow.webContents.send('load-game', filePaths[0])
    }
}

// Función para mostrar estadísticas
const showStats = () => {
    const statsWindow = new BrowserWindow({
        width: 800,
        height: 600,
        parent: mainWindow,
        modal: true,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        }
    })
    
    statsWindow.loadFile('views/stats.html')
    statsWindow.setMenu(null)
}

// Función para mostrar configuración
const showSettings = () => {
    const settingsWindow = new BrowserWindow({
        width: 600,
        height: 500,
        parent: mainWindow,
        modal: true,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        }
    })
    
    settingsWindow.loadFile('views/settings.html')
    settingsWindow.setMenu(null)
}

// Función para mostrar manual de usuario
const showUserManual = () => {
    dialog.showMessageBox(mainWindow, {
        type: 'info',
        title: 'Manual de Usuario',
        message: 'Cómo Jugar Sopa de Letras',
        detail: `
1. Selecciona una categoría desde el menú
2. Elige el nivel de dificultad
3. Busca las palabras en la grilla
4. Haz clic y arrastra para seleccionar palabras
5. ¡Encuentra todas las palabras antes de que se acabe el tiempo!

Atajos de teclado:
• Ctrl+N: Nueva partida
• Space: Pausar/Reanudar
• Ctrl+S: Guardar partida
• Ctrl+E: Ver estadísticas`
    })
}

// Función para mostrar información de la app
const showAbout = () => {
    dialog.showMessageBox(mainWindow, {
        type: 'info',
        title: 'Acerca de Sopa de Letras',
        message: 'Sopa de Letras v1.0.0',
        detail: 'Desarrollado con Electron JS\n© 2025 - Proyecto Académico TSDS SIO'
    })
}

// IPC Handlers - Comunicación con renderer
ipcMain.handle('show-notification', (event, title, body, icon) => {
    showNotification(title, body, icon)
})

ipcMain.handle('export-stats', async (event, data) => {
    const { filePath } = await dialog.showSaveDialog(mainWindow, {
        title: 'Exportar Estadísticas',
        defaultPath: 'estadisticas.json',
        filters: [
            { name: 'JSON', extensions: ['json'] },
            { name: 'CSV', extensions: ['csv'] }
        ]
    })
    
    if (filePath) {
        return filePath
    }
    return null
})



app.whenReady().then(() => {
    createWindow()
    createMenu()


    setTimeout(() => {
        showNotification('¡Bienvenido!', 'Disfruta jugando Sopa de Letras')
    }, 2000)
})

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit()
    }
})

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow()
    }
})