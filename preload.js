const {contextBridge, ipcRenderer} = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
    showNofication: (tittle, body) => {
        ipcRenderer.send('show-notification', tittle, body)
    }
});
