const { app, BrowserWindow, Menu, Notification, dialog, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow;
let statsWindow = null;
let settingsWindow = null;

const createWindow = () => {
    mainWindow = new BrowserWindow({
        width: 1000,
        height: 800,
        minWidth: 800,
        minHeight: 600,
        icon: path.join(__dirname, 'assets/img/icono.png'),
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            enableRemoteModule: true
        }
    });

    mainWindow.loadFile('views/menu.html');

    // Abrir devtools en desarrollo
    if (process.env.NODE_ENV === 'development') {
        mainWindow.webContents.openDevTools();
    }

    // Limpiar referencia al cerrar
    mainWindow.on('closed', () => {
        mainWindow = null;
    });
};

// Crear menú nativo
const createMenu = () => {
    const template = [
        {
            label: 'Juego',
            submenu: [
                {
                    label: 'Nueva partida',
                    accelerator: 'CmdOrCtrl+N',
                    click: () => {
                        if (mainWindow) {
                            mainWindow.webContents.send('new-game');
                        }
                    }
                },
                {
                    label: 'Pausar/Reanudar',
                    accelerator: 'Space',
                    click: () => {
                        if (mainWindow) {
                            mainWindow.webContents.send('pause-game');
                        }
                    }
                },
                { type: 'separator' },
                {
                    label: 'Guardar partida',
                    accelerator: 'CmdOrCtrl+S',
                    click: () => {
                        saveGame();
                    }
                },
                {
                    label: 'Cargar Partida',
                    accelerator: 'CmdOrCtrl+O',
                    click: () => {
                        loadGame();
                    }
                },
                { type: 'separator' },
                {
                    label: 'Salir',
                    accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
                    click: () => {
                        app.quit();
                    }
                }
            ]
        },
        {
            label: 'Categorías',
            submenu: [
                { label: 'Animales', type: 'radio', click: () => {
                    if (mainWindow) mainWindow.webContents.send('change-category', 'animals');
                }},
                { label: 'Países', type: 'radio', click: () => {
                    if (mainWindow) mainWindow.webContents.send('change-category', 'countries');
                }},
                { label: 'Ciencia', type: 'radio', click: () => {
                    if (mainWindow) mainWindow.webContents.send('change-category', 'science');
                }},
                { label: 'Deportes', type: 'radio', click: () => {
                    if (mainWindow) mainWindow.webContents.send('change-category', 'sports');
                }}
            ]
        },
        {
            label: 'Dificultad',
            submenu: [
                { label: 'Fácil (10x10)', type: 'radio', checked: true, click: () => {
                    if (mainWindow) mainWindow.webContents.send('change-difficulty', 'easy');
                }},
                { label: 'Medio (12x12)', type: 'radio', click: () => {
                    if (mainWindow) mainWindow.webContents.send('change-difficulty', 'medium');
                }},
                { label: 'Difícil (15x15)', type: 'radio', click: () => {
                    if (mainWindow) mainWindow.webContents.send('change-difficulty', 'hard');
                }}
            ]
        },
        {
            label: 'Ver',
            submenu: [
                { label: 'Estadísticas', accelerator: 'CmdOrCtrl+E', click: () => showStats() },
                { label: 'Configuración', accelerator: 'CmdOrCtrl+,', click: () => showSettings() },
                { type: 'separator' },
                { label: 'Pantalla Completa', accelerator: process.platform === 'darwin' ? 'Ctrl+Cmd+F' : 'F11', click: () => {
                    if (mainWindow) mainWindow.setFullScreen(!mainWindow.isFullScreen());
                }}
            ]
        },
        {
            label: 'Ayuda',
            submenu: [
                { label: 'Manual de Usuario', click: () => showUserManual() },
                { label: 'Acerca de', click: () => showAbout() }
            ]
        }
    ];

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
        });
    }

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
};

// Navegar a la pantalla de juego
const navigateToGame = () => {
    if (mainWindow) {
        mainWindow.loadFile('views/game.html');
    }
};

// Guardar partida
const saveGame = async () => {
    if (!mainWindow) return;
    
    const { filePath } = await dialog.showSaveDialog(mainWindow, {
        title: 'Guardar Partida',
        defaultPath: 'mi-partida.json',
        filters: [{ name: 'Archivos de Partida', extensions: ['json'] }]
    });

    if (filePath) {
        mainWindow.webContents.send('save-game', filePath);
    }
};

// Cargar partida
const loadGame = async () => {
    if (!mainWindow) return;
    
    const { filePaths } = await dialog.showOpenDialog(mainWindow, {
        title: 'Cargar Partida',
        filters: [{ name: 'Archivos de Partida', extensions: ['json'] }],
        properties: ['openFile']
    });

    if (filePaths.length > 0) {
        mainWindow.webContents.send('load-game', filePaths[0]);
    }
};

// Estadísticas
const showStats = () => {
    if (statsWindow) {
        statsWindow.focus();
        return;
    }

    statsWindow = new BrowserWindow({
        width: 1000,
        height: 700,
        parent: mainWindow,
        modal: false,
        webPreferences: { 
            nodeIntegration: true, 
            contextIsolation: false 
        },
        icon: path.join(__dirname, 'assets/img/icono.png')
    });
    
    statsWindow.loadFile('views/stats.html');
    statsWindow.setMenu(null);
    
    statsWindow.on('closed', () => {
        statsWindow = null;
    });
};

// Configuración
const showSettings = () => {
    if (settingsWindow) {
        settingsWindow.focus();
        return;
    }

    settingsWindow = new BrowserWindow({
        width: 600,
        height: 500,
        parent: mainWindow,
        modal: false,
        webPreferences: { 
            nodeIntegration: true, 
            contextIsolation: false 
        },
        icon: path.join(__dirname, 'assets/img/icono.png')
    });
    
    // Crear un HTML simple para configuración
    const settingsHtml = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Configuración - Sopa de Letras</title>
        <style>
            body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                margin: 0;
                padding: 20px;
                color: white;
            }
            .container {
                background: rgba(255, 255, 255, 0.1);
                backdrop-filter: blur(10px);
                border-radius: 15px;
                padding: 30px;
                max-width: 500px;
                margin: 0 auto;
            }
            h1 { text-align: center; margin-bottom: 30px; }
            .setting-group {
                margin-bottom: 20px;
            }
            label {
                display: block;
                margin-bottom: 5px;
                font-weight: 600;
            }
            select, input {
                width: 100%;
                padding: 10px;
                border: none;
                border-radius: 5px;
                background: rgba(255, 255, 255, 0.9);
                color: #333;
            }
            .btn-group {
                text-align: center;
                margin-top: 30px;
            }
            button {
                padding: 12px 24px;
                margin: 0 10px;
                border: none;
                border-radius: 25px;
                cursor: pointer;
                font-weight: 600;
                transition: all 0.3s ease;
            }
            .btn-primary {
                background: #4facfe;
                color: white;
            }
            .btn-secondary {
                background: #e0e0e0;
                color: #333;
            }
            button:hover {
                transform: translateY(-2px);
            }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>🎮 Configuración</h1>
            
            <div class="setting-group">
                <label>Sonido:</label>
                <select id="sound-setting">
                    <option value="on">Activado</option>
                    <option value="off">Desactivado</option>
                </select>
            </div>
            
            <div class="setting-group">
                <label>Animaciones:</label>
                <select id="animations-setting">
                    <option value="on">Activadas</option>
                    <option value="off">Desactivadas</option>
                </select>
            </div>
            
            <div class="setting-group">
                <label>Tema:</label>
                <select id="theme-setting">
                    <option value="default">Predeterminado</option>
                    <option value="dark">Oscuro</option>
                    <option value="light">Claro</option>
                </select>
            </div>
            
            <div class="setting-group">
                <label>Nombre del jugador:</label>
                <input type="text" id="player-name" placeholder="Introduce tu nombre" />
            </div>
            
            <div class="btn-group">
                <button class="btn-primary" onclick="saveSettings()">Guardar</button>
                <button class="btn-secondary" onclick="window.close()">Cerrar</button>
            </div>
        </div>
        
        <script>
            function saveSettings() {
                const settings = {
                    sound: document.getElementById('sound-setting').value,
                    animations: document.getElementById('animations-setting').value,
                    theme: document.getElementById('theme-setting').value,
                    playerName: document.getElementById('player-name').value
                };
                
                localStorage.setItem('gameSettings', JSON.stringify(settings));
                alert('Configuración guardada correctamente');
            }
            
            // Cargar configuración existente
            window.addEventListener('load', () => {
                const settings = JSON.parse(localStorage.getItem('gameSettings') || '{}');
                
                if (settings.sound) document.getElementById('sound-setting').value = settings.sound;
                if (settings.animations) document.getElementById('animations-setting').value = settings.animations;
                if (settings.theme) document.getElementById('theme-setting').value = settings.theme;
                if (settings.playerName) document.getElementById('player-name').value = settings.playerName;
            });
        </script>
    </body>
    </html>`;
    
    // Escribir HTML temporal
    const tempPath = path.join(__dirname, 'temp_settings.html');
    fs.writeFileSync(tempPath, settingsHtml);
    
    settingsWindow.loadFile(tempPath);
    settingsWindow.setMenu(null);
    
    settingsWindow.on('closed', () => {
        settingsWindow = null;
        // Limpiar archivo temporal
        if (fs.existsSync(tempPath)) {
            fs.unlinkSync(tempPath);
        }
    });
};

// Manual de usuario
const showUserManual = () => {
    if (!mainWindow) return;
    
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
    });
};

// Acerca de
const showAbout = () => {
    if (!mainWindow) return;
    
    dialog.showMessageBox(mainWindow, {
        type: 'info',
        title: 'Acerca de Sopa de Letras',
        message: 'Sopa de Letras v1.0.0',
        detail: 'Desarrollado con Electron JS\n© 2025 - Proyecto Académico TSDS SIO'
    });
};

// Notificaciones
const showNotification = (title, body, icon = 'icono') => {
    if (Notification.isSupported()) {
        new Notification({
            title,
            body,
            icon: path.join(__dirname, 'assets/img', `${icon}.png`)
        }).show();
    }
};

// IPC Handlers
ipcMain.handle('show-notification', (event, title, body, icon) => {
    showNotification(title, body, icon);
});

ipcMain.handle('navigate-to-game', () => {
    navigateToGame();
});

ipcMain.handle('show-stats', () => {
    showStats();
});

ipcMain.handle('show-settings', () => {
    showSettings();
});

ipcMain.handle('export-stats', async (event, data) => {
    if (!mainWindow) return null;
    
    const { filePath } = await dialog.showSaveDialog(mainWindow, {
        title: 'Exportar Estadísticas',
        defaultPath: 'estadisticas.json',
        filters: [
            { name: 'JSON', extensions: ['json'] },
            { name: 'CSV', extensions: ['csv'] }
        ]
    });

    if (filePath) {
        if (filePath.endsWith('.json')) {
            fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
        } else if (filePath.endsWith('.csv')) {
            const csv = Object.keys(data[0]).join(',') + '\n' + data.map(row => Object.values(row).join(',')).join('\n');
            fs.writeFileSync(filePath, csv, 'utf-8');
        }
        return filePath;
    }
    return null;
});

// Eventos de la aplicación
app.whenReady().then(() => {
    createWindow();
    createMenu();

    setTimeout(() => {
        showNotification('¡Bienvenido!', 'Disfruta jugando Sopa de Letras');
    }, 2000);
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});