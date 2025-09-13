const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
    // Notificaciones
    showNotification: (title, body, icon) => {
        return ipcRenderer.invoke('show-notification', title, body, icon);
    },
    
    // Navegación
    navigateToGame: () => {
        return ipcRenderer.invoke('navigate-to-game');
    },
    
    // Ventanas modales
    showStats: () => {
        return ipcRenderer.invoke('show-stats');
    },
    
    showSettings: () => {
        return ipcRenderer.invoke('show-settings');
    },
    
    // Exportar estadísticas
    exportStats: (data) => {
        return ipcRenderer.invoke('export-stats', data);
    },
    
    // Listeners para eventos del menú
    onMenuAction: (callback) => {
        ipcRenderer.on('menu-action', callback);
    },
    
    onNewGame: (callback) => {
        ipcRenderer.on('new-game', callback);
    },
    
    onTogglePause: (callback) => {
        ipcRenderer.on('toggle-pause', callback);
    },
    
    onChangeCategory: (callback) => {
        ipcRenderer.on('change-category', callback);
    },
    
    onChangeDifficulty: (callback) => {
        ipcRenderer.on('change-difficulty', callback);
    },
    removeAllListeners: (channel) => {
        ipcRenderer.removeAllListeners(channel);
    }
});